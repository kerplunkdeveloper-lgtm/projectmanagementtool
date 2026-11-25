const mongoose = require("mongoose");
const SortedRoom = require("../models/SortedRoom");
const RoomFile = require("../models/RoomFile");
const { roomConfig, publicConfig } = require("../config/rooms");
const {
  generateRoomCode,
  normalizeRoomCode,
  formatRoomCode,
} = require("../utils/roomSecurity");
const { validateUploadedFile, cleanDisplayName } = require("../utils/roomFileValidation");
const { putRoomFile, getRoomFileUrl, deleteRoomObject } = require("../utils/roomStorage");
const { purgeRoom } = require("../utils/roomCleanupScheduler");
const { broadcastNotes, evictFromRoomChannel } = require("../utils/roomSocket");
const DiffMatchPatch = require("diff-match-patch");

const dmp = new DiffMatchPatch();

// ---------- helpers ----------

const fail = (res, status, message, extra = {}) =>
  res.status(status).json({ success: false, message, ...extra });

const uid = (req) => req.user._id.toString();
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const isExpired = (room) => room.status !== "active" || new Date(room.expiresAt) <= new Date();
const memberOf = (room, userId) => room.members.find((m) => m.user.toString() === userId);
const isHost = (room, userId) => room.host.toString() === userId;

const clampText = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const parseExpiryMinutes = (value) => {
  const minutes = Number(value);
  const max = roomConfig.maxExpiryHours * 60;
  if (!Number.isFinite(minutes) || minutes < roomConfig.minExpiryMinutes || minutes > max) {
    return null;
  }
  return Math.round(minutes);
};

/** Pings members that something changed. Carries no room content: clients refetch via the API. */
const notifyRoom = (req, room, kind, extraUserIds = []) => {
  const io = req.app.get("io");
  if (!io) return;
  const ids = new Set([...room.members.map((m) => m.user.toString()), ...extraUserIds]);
  ids.forEach((id) => io.to(id).emit("sorted-room:changed", { roomId: room._id.toString(), kind }));
};

/**
 * Loads a room the current user is a member of.
 * Non-members get 404 (room existence is not disclosed). Members of an
 * expired/ended room get 410 so the UI can show the expired state.
 */
const loadMemberRoom = async (req, res, { secrets = false } = {}) => {
  const { id } = req.params;
  if (!isValidId(id)) {
    fail(res, 404, "Room not found");
    return null;
  }
  let query = SortedRoom.findById(id);
  if (secrets) query = query.select("+code");
  const room = await query;
  if (!room || !memberOf(room, uid(req))) {
    fail(res, 404, "Room not found");
    return null;
  }
  if (isExpired(room)) {
    fail(res, 410, "This room has expired or was ended by the host.", { expired: true });
    return null;
  }
  return room;
};

const requireHost = (req, res, room) => {
  if (!isHost(room, uid(req))) {
    fail(res, 403, "Only the room host can do this.");
    return false;
  }
  return true;
};

const notesPayload = (room) => {
  const updatedBy = room.notes?.updatedBy;
  const updatedById = updatedBy?._id?.toString?.() || updatedBy?.toString?.();
  const editor = room.members.find((m) => (m.user?._id || m.user)?.toString() === updatedById);
  return {
    content: room.notes?.content || "",
    version: room.notes?.version || 0,
    editSeq: room.notes?.editSeq || 0,
    updatedAt: room.notes?.updatedAt,
    updatedBy: updatedById ? { _id: updatedById, name: editor?.user?.name } : null,
  };
};

const notesUnreadFor = (room, userId) => {
  const me = room.members.find((m) => (m.user?._id || m.user)?.toString() === userId);
  return Math.max(0, (room.notes?.editSeq || 0) - (me?.notesSeenSeq || 0));
};

const serializeRoom = async (room, userId) => {
  await room.populate({
    path: "members.user",
    select: "name department profile",
    populate: { path: "profile", select: "profileImage" },
  });
  const stats = await RoomFile.aggregate([
    { $match: { room: room._id } },
    { $group: { _id: null, count: { $sum: 1 }, bytes: { $sum: "$size" } } },
  ]);
  const hostId = room.host.toString();
  return {
    _id: room._id,
    name: room.name,
    clientLabel: room.clientLabel,
    code: room.code ? formatRoomCode(room.code) : undefined,
    isHost: hostId === userId,
    hostId,
    locked: room.locked,
    permissions: room.permissions,
    expiresAt: room.expiresAt,
    createdAt: room.createdAt,
    codeRotatedAt: room.codeRotatedAt,
    members: room.members
      .filter((m) => m.user) // user may have been deleted
      .map((m) => ({
        _id: m.user._id,
        name: m.user.name,
        department: m.user.department,
        profile: m.user.profile,
        role: m.role,
        joinedAt: m.joinedAt,
        notesSeenSeq: m.notesSeenSeq || 0,
      })),
    notes: notesPayload(room),
    notesUnread: notesUnreadFor(room, userId),
    storage: { fileCount: stats[0]?.count || 0, bytesUsed: stats[0]?.bytes || 0 },
    limits: publicConfig(),
  };
};

const serializeFile = (f, room, userId) => ({
  _id: f._id,
  originalName: f.originalName,
  extension: f.extension,
  mimeType: f.mimeType,
  kind: f.kind,
  size: f.size,
  createdAt: f.createdAt,
  uploader: f.uploader ? { _id: f.uploader._id, name: f.uploader.name } : null,
  previewable: ["image", "pdf"].includes(f.kind),
  canDelete:
    isHost(room, userId) ||
    (room.permissions.membersCanDeleteOwnFiles && f.uploader?._id?.toString() === userId),
});

// ---------- rooms ----------

// @route GET /api/rooms/config
exports.getConfig = (req, res) => res.json({ success: true, data: publicConfig() });

// @route GET /api/rooms  — rooms I belong to
exports.listRooms = async (req, res) => {
  try {
    const rooms = await SortedRoom.find({
      "members.user": req.user._id,
      status: "active",
      expiresAt: { $gt: new Date() },
    })
      .populate("host", "name")
      .sort({ expiresAt: 1 })
      .lean();

    const counts = await RoomFile.aggregate([
      { $match: { room: { $in: rooms.map((r) => r._id) } } },
      { $group: { _id: "$room", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), c.count]));
    const me = uid(req);

    res.json({
      success: true,
      data: rooms.map((r) => ({
        _id: r._id,
        name: r.name,
        clientLabel: r.clientLabel,
        host: r.host ? { _id: r.host._id, name: r.host.name } : null,
        isHost: r.host?._id?.toString() === me,
        memberCount: r.members.length,
        notesUnread: notesUnreadFor(r, me),
        fileCount: countMap[r._id.toString()] || 0,
        locked: r.locked,
        expiresAt: r.expiresAt,
        createdAt: r.createdAt,
      })),
    });
  } catch (err) {
    console.error("[Rooms] list error:", err);
    fail(res, 500, "Could not load rooms");
  }
};

// @route POST /api/rooms
exports.createRoom = async (req, res) => {
  try {
    const name = clampText(req.body.name, 80);
    const clientLabel = clampText(req.body.clientLabel, 80);
    const minutes = parseExpiryMinutes(req.body.expiresInMinutes);
    if (!name) return fail(res, 400, "Room name is required.");
    if (!minutes) {
      return fail(
        res,
        400,
        `Expiry must be between ${roomConfig.minExpiryMinutes} minutes and ${roomConfig.maxExpiryHours} hours.`
      );
    }

    const activeCount = await SortedRoom.countDocuments({
      host: req.user._id,
      status: "active",
      expiresAt: { $gt: new Date() },
    });
    if (activeCount >= roomConfig.maxActiveRoomsPerHost) {
      return fail(
        res,
        429,
        `You can host up to ${roomConfig.maxActiveRoomsPerHost} active rooms. End one to create another.`
      );
    }

    let room;
    for (let attempt = 0; attempt < 3 && !room; attempt++) {
      try {
        room = await SortedRoom.create({
          name,
          clientLabel,
          host: req.user._id,
          members: [{ user: req.user._id, role: "host" }],
          code: generateRoomCode(),
          expiresAt: new Date(Date.now() + minutes * 60 * 1000),
        });
      } catch (e) {
        if (e.code !== 11000) throw e; // retry only on (astronomically unlikely) code collision
      }
    }
    if (!room) return fail(res, 500, "Could not create room. Please try again.");

    room = await SortedRoom.findById(room._id).select("+code");
    res.status(201).json({ success: true, data: await serializeRoom(room, uid(req)) });
  } catch (err) {
    console.error("[Rooms] create error:", err);
    fail(res, 500, "Could not create room");
  }
};

// @route POST /api/rooms/join  { code }  (rate-limited on failures)
exports.joinRoom = async (req, res) => {
  try {
    const code = normalizeRoomCode(req.body.code);
    const invalid = () => fail(res, 404, "That code is invalid, expired, or has been changed by the host.");
    if (!code) return invalid();

    const room = await SortedRoom.findOne({ code, status: "active", expiresAt: { $gt: new Date() } });
    if (!room) return invalid();

    const me = uid(req);
    if (memberOf(room, me)) return res.json({ success: true, data: { _id: room._id, alreadyMember: true } });

    if (room.bannedUsers.some((u) => u.toString() === me)) {
      return fail(res, 403, "The host removed you from this room.");
    }
    if (room.locked) return fail(res, 403, "This room is locked. Ask the host to unlock it.");
    if (room.members.length >= roomConfig.maxMembers) {
      return fail(res, 403, `This room is full (${roomConfig.maxMembers} members max).`);
    }

    // Atomic add guarded by the same conditions to avoid races with lock/remove/rotate.
    const updated = await SortedRoom.findOneAndUpdate(
      {
        _id: room._id,
        code,
        status: "active",
        locked: false,
        bannedUsers: { $ne: req.user._id },
        "members.user": { $ne: req.user._id },
        [`members.${roomConfig.maxMembers - 1}`]: { $exists: false },
      },
      {
        $push: {
          members: {
            user: req.user._id,
            role: "member",
            joinedAt: new Date(),
            // New members start "caught up": earlier notes updates aren't shown as unread
            notesSeenSeq: room.notes?.editSeq || 0,
          },
        },
      },
      { new: true }
    );
    if (!updated) return fail(res, 409, "Could not join the room. Please try again.");

    notifyRoom(req, updated, "members");
    res.json({ success: true, data: { _id: updated._id } });
  } catch (err) {
    console.error("[Rooms] join error:", err);
    fail(res, 500, "Could not join room");
  }
};

// @route GET /api/rooms/:id
exports.getRoom = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res, { secrets: true });
    if (!room) return;
    res.json({ success: true, data: await serializeRoom(room, uid(req)) });
  } catch (err) {
    console.error("[Rooms] get error:", err);
    fail(res, 500, "Could not load room");
  }
};

// @route PATCH /api/rooms/:id  (host) name, clientLabel, locked, permissions, expiresInMinutes
exports.updateRoom = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room || !requireHost(req, res, room)) return;

    const { name, clientLabel, locked, permissions, expiresInMinutes } = req.body;
    if (name !== undefined) {
      const n = clampText(name, 80);
      if (!n) return fail(res, 400, "Room name cannot be empty.");
      room.name = n;
    }
    if (clientLabel !== undefined) room.clientLabel = clampText(clientLabel, 80);
    if (typeof locked === "boolean") room.locked = locked;
    if (permissions && typeof permissions === "object") {
      ["membersCanUpload", "membersCanDeleteOwnFiles", "membersCanEditNotes"].forEach((k) => {
        if (typeof permissions[k] === "boolean") room.permissions[k] = permissions[k];
      });
    }
    if (expiresInMinutes !== undefined) {
      const minutes = parseExpiryMinutes(expiresInMinutes);
      if (!minutes) {
        return fail(
          res,
          400,
          `Expiry must be between ${roomConfig.minExpiryMinutes} minutes and ${roomConfig.maxExpiryHours} hours from now.`
        );
      }
      room.expiresAt = new Date(Date.now() + minutes * 60 * 1000);
      await RoomFile.updateMany({ room: room._id }, { $set: { expiresAt: room.expiresAt } });
    }
    await room.save();

    const full = await SortedRoom.findById(room._id).select("+code");
    notifyRoom(req, room, "settings");
    res.json({ success: true, data: await serializeRoom(full, uid(req)) });
  } catch (err) {
    console.error("[Rooms] update error:", err);
    fail(res, 500, "Could not update room");
  }
};

// @route POST /api/rooms/:id/rotate-code  (host) — old code stops working immediately
exports.rotateCode = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room || !requireHost(req, res, room)) return;
    let saved = false;
    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
      try {
        room.code = generateRoomCode();
        room.codeRotatedAt = new Date();
        await room.save();
        saved = true;
      } catch (e) {
        if (e.code !== 11000) throw e;
      }
    }
    const full = await SortedRoom.findById(room._id).select("+code");
    notifyRoom(req, room, "settings");
    res.json({ success: true, data: await serializeRoom(full, uid(req)) });
  } catch (err) {
    console.error("[Rooms] rotate code error:", err);
    fail(res, 500, "Could not change the room code");
  }
};

// @route DELETE /api/rooms/:id/members/:userId  (host) — removes and blocks rejoining
exports.removeMember = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room || !requireHost(req, res, room)) return;
    const { userId } = req.params;
    if (!isValidId(userId)) return fail(res, 404, "Member not found");
    if (userId === room.host.toString()) return fail(res, 400, "The host cannot be removed.");
    if (!memberOf(room, userId)) return fail(res, 404, "Member not found");

    const memberId = new mongoose.Types.ObjectId(userId);
    await SortedRoom.updateOne(
      { _id: room._id },
      { $pull: { members: { user: memberId } }, $addToSet: { bannedUsers: memberId } }
    );
    notifyRoom(req, room, "members", [userId]);
    evictFromRoomChannel(req.app.get("io"), room._id.toString(), userId);
    res.json({ success: true });
  } catch (err) {
    console.error("[Rooms] remove member error:", err);
    fail(res, 500, "Could not remove member");
  }
};

// @route POST /api/rooms/:id/leave  (non-host members)
exports.leaveRoom = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room) return;
    if (isHost(room, uid(req))) {
      return fail(res, 400, "Hosts can't leave their own room. End the room instead.");
    }
    await SortedRoom.updateOne({ _id: room._id }, { $pull: { members: { user: req.user._id } } });
    notifyRoom(req, room, "members");
    evictFromRoomChannel(req.app.get("io"), room._id.toString(), uid(req));
    res.json({ success: true });
  } catch (err) {
    console.error("[Rooms] leave error:", err);
    fail(res, 500, "Could not leave room");
  }
};

// @route DELETE /api/rooms/:id  (host) — ends the room and deletes all files
exports.endRoom = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room || !requireHost(req, res, room)) return;

    await SortedRoom.updateOne({ _id: room._id }, { $set: { status: "ended", endedAt: new Date() } });
    room.status = "ended";
    notifyRoom(req, room, "ended");
    res.json({ success: true });

    // Purge now; if storage is unavailable the cleanup job retries.
    purgeRoom(room, req.app.get("io")).catch((err) =>
      console.error(`[Rooms] immediate purge failed for ${room._id} (will retry):`, err.message || err)
    );
  } catch (err) {
    console.error("[Rooms] end error:", err);
    fail(res, 500, "Could not end room");
  }
};

// ---------- notes ----------

// @route PUT /api/rooms/:id/notes
// Real-time mode: { patch, clientId } — a diff-match-patch patch made from the
// client's last known server text. The server applies it to the CURRENT text
// (merging concurrent edits), saves with an atomic version check, then pushes
// the merged text to every authenticated subscriber of the room channel.
exports.updateNotes = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room) return;
    const me = uid(req);
    if (!isHost(room, me) && !room.permissions.membersCanEditNotes) {
      return fail(res, 403, "The host has made notes read-only.");
    }

    const { patch, content: fullContent } = req.body;
    const clientId = typeof req.body.clientId === "string" ? req.body.clientId.slice(0, 64) : undefined;
    let patches = null;
    if (typeof patch === "string") {
      if (patch.length > roomConfig.notesMaxChars * 3) return fail(res, 413, "Change is too large.");
      try {
        patches = dmp.patch_fromText(patch);
      } catch {
        return fail(res, 400, "Invalid notes change.");
      }
    } else if (typeof fullContent !== "string") {
      return fail(res, 400, "Nothing to save.");
    }

    const gapMs = roomConfig.notesEditGapSeconds * 1000;
    for (let attempt = 0; attempt < 6; attempt++) {
      const current = await SortedRoom.findById(room._id).select("notes status expiresAt");
      if (!current || current.status !== "active" || current.expiresAt <= new Date()) {
        return fail(res, 410, "This room has expired or was ended by the host.", { expired: true });
      }
      const curText = current.notes?.content || "";
      const curVersion = current.notes?.version || 0;
      const nextText = patches ? dmp.patch_apply(patches, curText)[0] : fullContent;
      if (nextText.length > roomConfig.notesMaxChars) {
        return fail(res, 413, `Notes are limited to ${roomConfig.notesMaxChars.toLocaleString()} characters.`, {
          data: { content: curText, version: curVersion },
        });
      }
      if (nextText === curText) {
        return res.json({
          success: true,
          data: {
            content: curText,
            version: curVersion,
            editSeq: current.notes?.editSeq || 0,
            updatedAt: current.notes?.updatedAt,
            clientId,
            unchanged: true,
          },
        });
      }

      // A new "update" (unit for unread badges) starts when the editor changes or after a pause.
      const lastBy = current.notes?.updatedBy?.toString();
      const lastAt = current.notes?.updatedAt ? new Date(current.notes.updatedAt).getTime() : 0;
      const newSession = lastBy !== me || Date.now() - lastAt > gapMs;
      const editSeq = (current.notes?.editSeq || 0) + (newSession ? 1 : 0);
      const now = new Date();

      const updated = await SortedRoom.findOneAndUpdate(
        { _id: room._id, "notes.version": curVersion },
        {
          $set: {
            "notes.content": nextText,
            "notes.version": curVersion + 1,
            "notes.editSeq": editSeq,
            "notes.updatedBy": req.user._id,
            "notes.updatedAt": now,
            "members.$[me].notesSeenSeq": editSeq, // the editor has seen their own update
          },
        },
        { new: true, arrayFilters: [{ "me.user": req.user._id }] }
      );
      if (!updated) continue; // someone saved in between: re-apply on the newer text

      const payload = {
        content: nextText,
        version: curVersion + 1,
        editSeq,
        updatedAt: now,
        updatedBy: { _id: me, name: req.user.name },
        clientId,
      };
      broadcastNotes(req.app.get("io"), room._id.toString(), payload);
      if (newSession) notifyRoom(req, updated, "notes"); // content-free ping for Rooms list badges
      return res.json({ success: true, data: payload });
    }
    return fail(res, 409, "The notes are very busy right now. Please try again.");
  } catch (err) {
    console.error("[Rooms] notes error:", err);
    fail(res, 500, "Could not save notes");
  }
};

// @route POST /api/rooms/:id/notes/seen  { seq } — marks notes updates as seen
exports.markNotesSeen = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room) return;
    const latest = room.notes?.editSeq || 0;
    const asked = Number(req.body.seq);
    const seq = Math.min(Math.max(0, Number.isFinite(asked) ? asked : latest), latest);
    await SortedRoom.updateOne(
      { _id: room._id },
      { $max: { "members.$[me].notesSeenSeq": seq } },
      { arrayFilters: [{ "me.user": req.user._id }] }
    );
    notifyRoom(req, room, "notes-seen");
    res.json({ success: true, data: { seq } });
  } catch (err) {
    console.error("[Rooms] notes seen error:", err);
    fail(res, 500, "Could not update");
  }
};

// ---------- files ----------

// @route GET /api/rooms/:id/files
exports.listFiles = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room) return;
    const files = await RoomFile.find({ room: room._id }).populate("uploader", "name").sort({ createdAt: -1 });
    res.json({ success: true, data: files.map((f) => serializeFile(f, room, uid(req))) });
  } catch (err) {
    console.error("[Rooms] list files error:", err);
    fail(res, 500, "Could not load files");
  }
};

// Runs BEFORE multer so non-members / over-quota uploads never reach disk.
exports.preUpload = async (req, res, next) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room) return;
    if (!isHost(room, uid(req)) && !room.permissions.membersCanUpload) {
      return fail(res, 403, "The host has turned off uploads for members.");
    }
    const declared = Number(req.headers["content-length"] || 0);
    if (declared > roomConfig.maxFileBytes + 64 * 1024) {
      return fail(res, 413, `Files must be ${Math.round(roomConfig.maxFileBytes / 1048576)} MB or smaller.`);
    }
    const stats = await RoomFile.aggregate([
      { $match: { room: room._id } },
      { $group: { _id: null, count: { $sum: 1 }, bytes: { $sum: "$size" } } },
    ]);
    const count = stats[0]?.count || 0;
    const bytes = stats[0]?.bytes || 0;
    if (count >= roomConfig.maxFilesPerRoom) {
      return fail(res, 413, `This room has reached its ${roomConfig.maxFilesPerRoom}-file limit.`);
    }
    if (bytes >= roomConfig.maxRoomBytes) {
      return fail(res, 413, "This room has reached its storage limit.");
    }
    req.room = room;
    req.roomBytesUsed = bytes;
    next();
  } catch (err) {
    console.error("[Rooms] pre-upload error:", err);
    fail(res, 500, "Upload failed");
  }
};

// @route POST /api/rooms/:id/files  (multipart field "file")
exports.uploadFile = async (req, res) => {
  const file = req.file;
  const cleanup = () => file?.path && require("fs").unlink(file.path, () => {});
  try {
    if (!file) return fail(res, 400, "Choose a file to upload.");
    const room = req.room;

    const check = await validateUploadedFile(file);
    if (!check.ok) {
      cleanup();
      return fail(res, 415, check.message);
    }
    if (req.roomBytesUsed + file.size > roomConfig.maxRoomBytes) {
      cleanup();
      const leftMb = Math.max(0, (roomConfig.maxRoomBytes - req.roomBytesUsed) / 1048576).toFixed(1);
      return fail(res, 413, `Not enough room storage left (${leftMb} MB available).`);
    }

    // Re-check the room is still live right before storing (it may have ended mid-upload).
    const live = await SortedRoom.exists({ _id: room._id, status: "active", expiresAt: { $gt: new Date() } });
    if (!live) {
      cleanup();
      return fail(res, 410, "This room has expired or was ended by the host.", { expired: true });
    }

    const stored = await putRoomFile(room._id.toString(), file, check.type.mime);
    const doc = await RoomFile.create({
      room: room._id,
      uploader: req.user._id,
      originalName: cleanDisplayName(file.originalname),
      extension: check.extension,
      mimeType: check.type.mime,
      kind: check.type.kind,
      size: file.size,
      storageKey: stored.key,
      bucket: stored.bucket,
      expiresAt: room.expiresAt,
    });
    await doc.populate("uploader", "name");
    notifyRoom(req, room, "files");
    res.status(201).json({ success: true, data: serializeFile(doc, room, uid(req)) });
  } catch (err) {
    cleanup();
    console.error("[Rooms] upload error:", err);
    fail(res, err.statusCode || 500, err.statusCode ? err.message : "Upload failed. Please try again.");
  }
};

// @route GET /api/rooms/:id/files/:fileId/url?mode=preview|download
exports.getFileUrl = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room) return;
    if (!isValidId(req.params.fileId)) return fail(res, 404, "File not found");
    const file = await RoomFile.findOne({ _id: req.params.fileId, room: room._id }).select("+storageKey +bucket");
    if (!file) return fail(res, 404, "File not found");

    const inline = req.query.mode === "preview" && ["image", "pdf"].includes(file.kind);
    const url = await getRoomFileUrl(file, { inline });
    res.set("Cache-Control", "no-store");
    res.json({ success: true, data: { url, expiresIn: roomConfig.signedUrlSeconds } });
  } catch (err) {
    console.error("[Rooms] file url error:", err);
    fail(res, err.statusCode || 500, err.statusCode ? err.message : "Could not open file");
  }
};

// @route DELETE /api/rooms/:id/files/:fileId
exports.deleteFile = async (req, res) => {
  try {
    const room = await loadMemberRoom(req, res);
    if (!room) return;
    if (!isValidId(req.params.fileId)) return fail(res, 404, "File not found");
    const file = await RoomFile.findOne({ _id: req.params.fileId, room: room._id }).select("+storageKey +bucket");
    if (!file) return fail(res, 404, "File not found");

    const me = uid(req);
    const allowed =
      isHost(room, me) || (room.permissions.membersCanDeleteOwnFiles && file.uploader.toString() === me);
    if (!allowed) return fail(res, 403, "You can't delete this file.");

    await deleteRoomObject(file.bucket, file.storageKey);
    await RoomFile.deleteOne({ _id: file._id });
    notifyRoom(req, room, "files");
    res.json({ success: true });
  } catch (err) {
    console.error("[Rooms] delete file error:", err);
    fail(res, err.statusCode || 500, err.statusCode ? err.message : "Could not delete file");
  }
};
