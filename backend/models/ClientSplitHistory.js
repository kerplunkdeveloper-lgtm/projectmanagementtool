const mongoose = require("mongoose");

// One row per Client Split move (drag & drop reassignment of a client between executives)
const ClientSplitHistorySchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
    // Snapshots so history stays readable even if the client / users are renamed or removed
    clientName: { type: String, default: "" },
    branch: { type: String, default: "" },
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fromUserName: { type: String, default: "" },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toUserName: { type: String, default: "" },
    movedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    movedByName: { type: String, default: "" },
    movedTasks: { type: Number, default: 0 },
    movedSubtasks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ClientSplitHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model("ClientSplitHistory", ClientSplitHistorySchema);
