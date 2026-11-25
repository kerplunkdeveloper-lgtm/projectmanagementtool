const mongoose = require("mongoose");

const roomFileSchema = new mongoose.Schema(
  {
    room: { type: mongoose.Schema.Types.ObjectId, ref: "SortedRoom", required: true, index: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true, maxlength: 200 },
    extension: { type: String, required: true },
    mimeType: { type: String, required: true },
    kind: { type: String, default: "document" },
    size: { type: Number, required: true },
    // Private object key. Never exposed to the browser; downloads use short-lived signed URLs.
    storageKey: { type: String, required: true, select: false },
    bucket: { type: String, required: true, select: false },
    // Mirrors the room expiry so orphaned files are still swept by the cleanup job.
    expiresAt: { type: Date, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("RoomFile", roomFileSchema);
