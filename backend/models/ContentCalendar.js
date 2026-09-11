const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  dueDate: {
    type: String,
    default: "",
  },
  assignee: {
    type: String,
    default: "SM",
  },
  assigneeUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const commentSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  userAvatar: {
    type: String,
    default: "",
  },
  text: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  size: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "image",
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const contentCalendarSchema = new mongoose.Schema(
  {
    taskName: {
      type: String,
      required: true,
      trim: true,
    },
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    taskCategory: {
      type: String,
      required: true,
      default: "Publishing",
    },
    contentType: {
      type: String,
      enum: ["Post", "Reels", "Stories"],
      default: "Post",
    },
    platform: {
      type: String,
      default: "Instagram",
    },
    platforms: {
      type: [String],
      default: ["Instagram"],
    },
    dueDate: {
      type: Date,
      required: true,
    },
    dueTime: {
      type: String,
      default: "",
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: [
        "To Do",
        "In-Progress",
        "Waiting",
        "Scheduled",
        "Published",
        "Overdue",
        "to do",
        "In-progress",
        "waiting",
        "scheduled",
        "published",
        "overdue",
        "Not Started",
        "In Progress",
        "In Review",
        "Completed",
      ],
      default: "To Do",
    },
    description: {
      type: String,
      default: "",
    },
    subtasks: [subtaskSchema],
    comments: [commentSchema],
    files: [fileSchema],
    tags: {
      type: [String],
      default: [],
    },
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
contentCalendarSchema.index({ dueDate: 1, createdAt: -1 });
contentCalendarSchema.index({ client: 1 });
contentCalendarSchema.index({ assignedTo: 1 });
contentCalendarSchema.index({ status: 1 });
contentCalendarSchema.index({ createdBy: 1 });
contentCalendarSchema.index({ contentType: 1 });
contentCalendarSchema.index({ "subtasks.assigneeUser": 1 });

module.exports = mongoose.model("ContentCalendar", contentCalendarSchema);
