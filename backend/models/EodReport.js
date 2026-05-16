const mongoose = require("mongoose");

const eodReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },

    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    tasksCompleted: {
      type: String,
      required: [true, "Please describe the tasks completed today"],
    },

    blockers: {
      type: String,
      default: "None",
    },

    nextDayPlan: {
      type: String,
      required: [true, "Please describe your plan for tomorrow"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("EodReport", eodReportSchema);
