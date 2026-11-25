// Authenticated real-time channel for Sorted Rooms (shared notes + typing).
//
// The app's existing socket "join" event trusts a client-supplied user id, so
// room content is NEVER sent to those per-user socket rooms. Instead a client
// must subscribe with its JWT; the server verifies the token, the user's
// account status and room membership before adding the socket to the private
// channel "sroom:<roomId>". Removed members are evicted from the channel.

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const SortedRoom = require("../models/SortedRoom");

const channel = (roomId) => `sroom:${roomId}`;

const verifyUser = async (token) => {
  if (!token || typeof token !== "string") return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("name employmentStatus accountStatus");
    if (!user || user.employmentStatus === "relieved" || user.accountStatus === "inactive") return null;
    return user;
  } catch {
    return null;
  }
};

function attachRoomSocket(io, socket) {
  socket.data.sortedRooms = socket.data.sortedRooms || {}; // roomId -> { userId, name }
  let lastTyping = 0;

  socket.on("sorted-room:subscribe", async (payload, ack) => {
    const reply = typeof ack === "function" ? ack : () => {};
    try {
      const { roomId, token } = payload || {};
      if (!mongoose.Types.ObjectId.isValid(roomId)) return reply({ ok: false });
      // Same sources as the REST `protect` middleware: explicit token, else the auth cookie
      const cookieToken = /(?:^|;\s*)token=([^;]+)/.exec(socket.handshake.headers?.cookie || "")?.[1];
      const user = await verifyUser(token || (cookieToken && decodeURIComponent(cookieToken)));
      if (!user) return reply({ ok: false, reason: "auth" });

      const room = await SortedRoom.findById(roomId).select("members status expiresAt notes");
      const isMember = room?.members.some((m) => m.user.toString() === user._id.toString());
      if (!room || !isMember || room.status !== "active" || room.expiresAt <= new Date()) {
        return reply({ ok: false, reason: "access" });
      }

      socket.join(channel(roomId));
      socket.data.sortedRooms[roomId] = { userId: user._id.toString(), name: user.name };
      reply({
        ok: true,
        notes: {
          content: room.notes?.content || "",
          version: room.notes?.version || 0,
          editSeq: room.notes?.editSeq || 0,
          updatedAt: room.notes?.updatedAt,
        },
      });
    } catch (err) {
      console.error("[RoomSocket] subscribe error:", err.message || err);
      reply({ ok: false });
    }
  });

  socket.on("sorted-room:unsubscribe", ({ roomId } = {}) => {
    if (!roomId) return;
    socket.leave(channel(roomId));
    delete socket.data.sortedRooms[roomId];
  });

  // "X is typing…" (only from authenticated channel members, lightly throttled)
  socket.on("sorted-room:typing", ({ roomId } = {}) => {
    const who = roomId && socket.data.sortedRooms[roomId];
    if (!who) return;
    const now = Date.now();
    if (now - lastTyping < 800) return;
    lastTyping = now;
    socket.to(channel(roomId)).emit("sorted-room:typing", { roomId, userId: who.userId, name: who.name });
  });
}

/** Send updated notes to every authenticated subscriber of the room. */
const broadcastNotes = (io, roomId, payload) => {
  if (io) io.to(channel(roomId)).emit("sorted-room:notes", { roomId: roomId.toString(), ...payload });
};

/** Remove one user's sockets from a room channel (member removed / left). */
const evictFromRoomChannel = async (io, roomId, userId) => {
  if (!io) return;
  try {
    const sockets = await io.in(channel(roomId)).fetchSockets();
    sockets.forEach((s) => {
      if (s.data?.sortedRooms?.[roomId]?.userId === userId.toString()) {
        s.leave(channel(roomId));
        delete s.data.sortedRooms[roomId];
      }
    });
  } catch (err) {
    console.error("[RoomSocket] evict error:", err.message || err);
  }
};

/** Close a room channel entirely (room ended / expired). */
const closeRoomChannel = (io, roomId) => {
  if (io) io.in(channel(roomId)).socketsLeave(channel(roomId));
};

module.exports = { attachRoomSocket, broadcastNotes, evictFromRoomChannel, closeRoomChannel };
