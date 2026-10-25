const mongoose = require("mongoose");

const ChecklistItemSchema = new mongoose.Schema(
  {
    item: {
      type: String,
      required: true,
      trim: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { _id: true }
);

const AttachmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Attachment",
    },
    url: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      default: "",
    },
    size: {
      type: Number,
      default: 0,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const HrTaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    category: {
      type: String,
      default: "General HR",
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Urgent"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "In Progress",
        "Submitted",
        "Completed",
        "Changes Requested",
        "Cancelled",
      ],
      default: "Pending",
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "HR assignee is required"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator is required"],
    },
    checklist: [ChecklistItemSchema],
    attachments: [AttachmentSchema],

    // Blocker status
    blocker: {
      hasBlocker: {
        type: Boolean,
        default: false,
      },
      description: {
        type: String,
        default: "",
      },
      flaggedAt: {
        type: Date,
        default: null,
      },
      flaggedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      resolved: {
        type: Boolean,
        default: false,
      },
      resolvedAt: {
        type: Date,
        default: null,
      },
    },

    // Work Submission for Manager review
    submission: {
      notes: {
        type: String,
        default: "",
      },
      submittedAt: {
        type: Date,
        default: null,
      },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      attachments: [AttachmentSchema],
    },

    // Manager Review decision
    review: {
      decision: {
        type: String,
        enum: ["Approved", "Changes Requested", null],
        default: null,
      },
      feedback: {
        type: String,
        default: "",
      },
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      reviewedAt: {
        type: Date,
        default: null,
      },
    },

    // Comments & Progress Notes
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
          trim: true,
        },
        isFeedback: {
          type: Boolean,
          default: false,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Timestamped Activity History
    activityHistory: [
      {
        action: {
          type: String,
          required: true,
        },
        details: {
          type: String,
          default: "",
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    dueSoonNotified: {
      type: Boolean,
      default: false,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for high performance querying
HrTaskSchema.index({ assignedTo: 1, status: 1 });
HrTaskSchema.index({ createdBy: 1, status: 1 });
HrTaskSchema.index({ dueDate: 1 });
HrTaskSchema.index({ status: 1 });
HrTaskSchema.index({ createdAt: -1 });

module.exports = mongoose.model("HrTask", HrTaskSchema);
