const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a project name"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Completed", "On Hold", "Inactive"],
      default: "Active",
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
    },
    access: {
      type: String,
      enum: ["Public", "Private"],
      default: "Public",
    },
    sections: {
      type: [String],
      default: ["Recently assigned"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes to optimize project queries
ProjectSchema.index({ client: 1 });
ProjectSchema.index({ status: 1 });
ProjectSchema.index({ createdBy: 1 });
ProjectSchema.index({ client: 1, status: 1 });

module.exports = mongoose.model("Project", ProjectSchema);
