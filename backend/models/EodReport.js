const mongoose = require("mongoose");

const eodReportSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    projectName: {
      type: String,
      required: [true, "Project name is required"],
    },

    date: {
      type: Date,
      default: Date.now,
      required: true,
    },

    description: {
      type: String,
      required: [true, "Please provide a description"],
    },

    status: {
      type: String,
      enum: ["In Progress", "Completed", "On Hold", "Pending"],
      default: "Completed",
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
