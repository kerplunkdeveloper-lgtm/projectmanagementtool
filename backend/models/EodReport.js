const mongoose = require("mongoose");

const eodReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    projectsWorkedOn: {
      type: String,
      required: [true, "Projects Worked On is required"],
    },

    tasksCompleted: {
      type: String,
      required: [true, "Tasks Completed is required"],
    },

    designCount: {
      type: String,
      default: "",
    },

    filesSubmitted: {
      type: String,
      default: "",
    },

    pendingTasks: {
      type: String,
      default: "",
    },

    reasonForPending: {
      type: String,
      default: "",
    },

    challengesFaced: {
      type: String,
      default: "",
    },

    tomorrowPlan: {
      type: String,
      required: [true, "Tomorrow Plan is required"],
    },

    supportNeeded: {
      type: String,
      default: "",
    },

    overallStatus: {
      type: String,
      required: [true, "Overall Status is required"],
    },

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
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EodReport", eodReportSchema);
