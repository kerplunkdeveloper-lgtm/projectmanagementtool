const mongoose = require("mongoose");

const SubtaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "On Hold"],
    default: "Pending",
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  startDate: {
    type: Date,
  },
  dueDate: {
    type: Date,
  },
  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
  },
});

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
      trim: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed", "On Hold"],
      default: "Pending",
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    section: {
      type: String,
      default: "Recently assigned",
    },
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    attachments: [
      {
        url: {
          type: String,
          required: true,
        },
        filename: {
          type: String,
          required: true,
        },
        fileType: String,
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    subtasks: [SubtaskSchema],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Task", TaskSchema);
