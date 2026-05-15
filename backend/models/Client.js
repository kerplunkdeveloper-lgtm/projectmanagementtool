

const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    industry: {
      type: String,
      required: true,
      trim: true,
    },

    primaryContact: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    services: [
      {
        type: String,
        enum: [
          "SMM",
          "SEO",
          "Ads",
          "Video",
          "Brand",
        ],
      },
    ],

    healthStatus: {
      type: String,
      enum: [
        "Green",
        "Yellow",
        "Red",
      ],
      default: "Green",
    },

    notes: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
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

module.exports = mongoose.model(
  "Client",
  clientSchema
);