// Server-side cleanup for Sorted Rooms.
// Runs on an interval (ROOM_CLEANUP_INTERVAL_MINUTES, default 5) and once at startup:
//  1. Rooms that have expired or been ended by the host are marked "ended"
//     (instantly inaccessible), their stored objects are deleted, then the
//     file records and the room record are deleted.
//  2. Any file record past its expiry whose room no longer exists is swept too.
// If storage deletion fails, database records are kept so the next run retries;
// a file is never "forgotten" while its object might still exist.

const SortedRoom = require("../models/SortedRoom");
const RoomFile = require("../models/RoomFile");
const { roomConfig } = require("../config/rooms");
const { deleteRoomObject, deleteRoomPrefix } = require("./roomStorage");

let running = false;

const notifyMembers = (io, room, payload) => {
  if (!io || !room?.members) return;
  room.members.forEach((m) => io.to(m.user.toString()).emit("sorted-room:changed", payload));
};

/** Permanently removes a room, its files, and their stored objects. */
const purgeRoom = async (room, io) => {
  const roomId = room._id.toString();
  if (room.status !== "ended") {
    await SortedRoom.updateOne({ _id: room._id }, { $set: { status: "ended", endedAt: new Date() } });
  }

  const files = await RoomFile.find({ room: room._id }).select("+storageKey +bucket");
  for (const f of files) {
    await deleteRoomObject(f.bucket, f.storageKey); // throws -> retried next run
    await RoomFile.deleteOne({ _id: f._id });
  }
  await deleteRoomPrefix(roomId); // orphans (e.g. interrupted uploads)

  await SortedRoom.deleteOne({ _id: room._id });
  notifyMembers(io, room, { roomId, kind: "ended" });
};

const runRoomCleanup = async (io) => {
  if (running) return;
  running = true;
  let purged = 0;
  try {
    const now = new Date();
    const rooms = await SortedRoom.find({
      $or: [{ expiresAt: { $lte: now } }, { status: "ended" }],
    })
      .select("_id status members")
      .limit(200);

    for (const room of rooms) {
      try {
        await purgeRoom(room, io);
        purged++;
      } catch (err) {
        console.error(`[RoomCleanup] Failed to purge room ${room._id}:`, err.message || err);
      }
    }

    // Orphaned, expired file records (room already gone)
    const staleFiles = await RoomFile.find({ expiresAt: { $lte: now } })
      .select("+storageKey +bucket room")
      .limit(500);
    for (const f of staleFiles) {
      const roomExists = await SortedRoom.exists({ _id: f.room });
      if (roomExists) continue; // handled with its room
      try {
        await deleteRoomObject(f.bucket, f.storageKey);
        await RoomFile.deleteOne({ _id: f._id });
      } catch (err) {
        console.error(`[RoomCleanup] Failed to delete orphan file ${f._id}:`, err.message || err);
      }
    }

    if (purged) console.log(`[RoomCleanup] Purged ${purged} expired/ended room(s).`);
  } catch (err) {
    console.error("[RoomCleanup] Run failed:", err.message || err);
  } finally {
    running = false;
  }
};

function startRoomCleanupScheduler(app) {
  const tick = () => runRoomCleanup(app.get("io"));
  setTimeout(tick, 30 * 1000); // shortly after startup
  setInterval(tick, roomConfig.cleanupIntervalMinutes * 60 * 1000);
}

module.exports = { startRoomCleanupScheduler, runRoomCleanup, purgeRoom };
