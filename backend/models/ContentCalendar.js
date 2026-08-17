const mongoose = require("mongoose");

const contentCalendarSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      default: "",
      trim: true,
    },
    scheduledDate: {
      type: Date,
      required: true,
      index: true,
    },
    time: {
      type: String,
      default: "10:00 AM",
      trim: true,
    },
    link: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "Post",
    },
    platform: [
      {
        type: String,
        enum: [
          "Instagram",
          "Facebook",
          "LinkedIn",
          "Twitter",
          "YouTube",
          "Pinterest",
          "TikTok",
          "Threads",
          "Other",
        ],
        default: "Instagram",
      },
    ],
    status: {
      type: String,
      enum: [
        "Draft",
        "Planned",
        "In Review",
        "Approved",
        "Scheduled",
        "Published",
      ],
      default: "Planned",
    },
    media: [
      {
        url: { type: String, required: true },
        public_id: { type: String },
        mediaType: { type: String, default: "image" },
        filename: { type: String },
        size: { type: Number },
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    notes: {
      type: String,
      default: "",
    },
    color: {
      type: String,
      default: "#3b82f6",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ContentCalendar", contentCalendarSchema);
