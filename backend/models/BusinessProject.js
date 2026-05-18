const mongoose = require("mongoose");

const businessProjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Project name is required"],
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Client is required"],
    },
    type: {
      type: String,
      required: [true, "Project type is required"],
      enum: ["Digital Marketing", "Website", "SEO"],
    },
    status: {
      type: String,
      default: "Active",
      enum: ["Active", "Completed", "On Hold", "Inactive"],
    },
    revenue: {
      type: Number,
      required: [true, "Monthly value is required"],
    },
    cost: {
      type: Number,
      default: 0,
    },
    duration: {
      type: String,
      default: "Ongoing / Retainer",
    },
    employees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

// Pre-save to calculate cost if not set
businessProjectSchema.pre("save", function () {
  if (this.isNew || this.isModified('revenue')) {
    // Generate a random cost between 50% to 85% of revenue for realistic dummy data
    if (!this.cost || this.cost === 0) {
        const costPercentage = Math.floor(Math.random() * (85 - 50 + 1) + 50) / 100;
        this.cost = Math.round(this.revenue * costPercentage);
    }
  }
});

module.exports = mongoose.model("BusinessProject", businessProjectSchema);
