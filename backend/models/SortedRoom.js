const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["host", "member"], default: "member" },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sortedRoomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    clientLabel: { type: String, trim: true, maxlength: 80, default: "" },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    members: { type: [memberSchema], default: [] },
    // Users removed by the host. They cannot rejoin this room, even with a new code.
    bannedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // Secret join code (normalized, no dashes). Never returned to non-members.
    code: { type: String, required: true, unique: true, select: false },
    codeRotatedAt: { type: Date, default: Date.now },

    // Unguessable external meeting room name. Contains no customer data.
    meetingName: { type: String, required: true, select: false },

    locked: { type: Boolean, default: false },
    permissions: {
      membersCanUpload: { type: Boolean, default: true },
      membersCanDeleteOwnFiles: { type: Boolean, default: true },
      membersCanEditNotes: { type: Boolean, default: true },
    },

    notes: {
      content: { type: String, default: "" },
      version: { type: Number, default: 0 },
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      updatedAt: { type: Date },
    },

    expiresAt: { type: Date, required: true, index: true },
    // "ended" rooms are inaccessible immediately and purged by the cleanup job.
    status: { type: String, enum: ["active", "ended"], default: "active", index: true },
    endedAt: { type: Date },
  },
  { timestamps: true }
);

sortedRoomSchema.index({ "members.user": 1, status: 1 });

module.exports = mongoose.model("SortedRoom", sortedRoomSchema);
