const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // null for group chat messages
    },
    chatRoom: {
      type: String, // 'group' or 'direct'
      default: "direct",
    },
    text: {
      type: String,
      trim: true,
    },
    sticker: {
      type: String, // Code/emoji/URL of the sticker
    },
    messageType: {
      type: String,
      enum: ["text", "sticker", "call"],
      default: "text",
    },
    callStatus: {
      type: String, // 'started', 'missed', 'ended'
    },
    callDuration: {
      type: String, // Call duration if ended (e.g., "02:14")
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", MessageSchema);
