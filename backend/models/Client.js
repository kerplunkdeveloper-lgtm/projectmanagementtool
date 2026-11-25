const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
      trim: true,
    },

    branch: {
      type: String,
      required: [true, "Branch is required"],
      trim: true,
      default: "Pondicherry",
    },

    industry: {
      type: String,
      required: true,
      trim: true,
    },

    onboardingDate: {
      type: Date,
      default: Date.now,
    },

    phoneNumber: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },

    spoc: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    budget: {
      type: Number,
      required: true,
      default: 0,
    },

    gst: {
      type: Number,
      default: 18,
    },

    totalBudget: {
      type: Number,
      default: 0,
    },

    service: {
      type: [String],
      enum: [
        "Digital Marketing",
        "Social Media Management",
        "SEO",
        "Content Marketing",
        "Branding & Identity",
        "Website",
        "Additional work",
        "Video Production",
        "Others",
      ],
      required: true,
    },

    // "Recurring" = only ongoing services, "One-time" = only fixed-scope,
    // "Hybrid" = both. Derived from serviceDetails on save.
    projectType: {
      type: String,
      enum: ["Recurring", "One-time", "Hybrid", ""],
      default: "",
    },

    // Per-service schedule. `service` above stays the flat list of names
    // so existing filters keep working.
    serviceDetails: [
      {
        _id: false,
        name: { type: String, required: true },
        type: { type: String, enum: ["Recurring", "One-time"], required: true },
        billingCycle: {
          type: String,
          enum: ["Monthly", "Quarterly", "Half-yearly", "Yearly", ""],
          default: "",
        },
        timeline: {
          type: String,
          enum: ["Fixed Duration", "Open (TBD)", ""],
          default: "",
        },
        startDate: { type: Date },
        endDate: { type: Date, default: null },
      },
    ],

    // DIGITAL MARKETING
    reels: {
      type: Number,
      default: 0,
    },

    posts: {
      type: Number,
      default: 0,
    },

    story: {
      type: Number,
      default: 0,
    },

    needDslr: {
      type: String,
      enum: ["Need DSLR", "No DSLR", ""],
      default: "",
    },

    // WEBSITE
    pages: {
      type: Number,
      default: 0,
    },

    // SEO
    onpage: {
      type: Boolean,
      default: false,
    },

    offpage: {
      type: Boolean,
      default: false,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    assignedTo: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],

    color: {
      type: String,
      default: "#3b82f6",
    },

    icon: {
      type: String,
      default: "FaRegBuilding",
    },
    
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    
    inactiveReason: {
      type: String,
      default: "",
    },

    authMethods: [{
      method: { type: String, required: true },
      config: { type: String, default: "" },
      status: {
        type: String,
        enum: ["Enabled", "Not Configured", "Disabled", "Configured"],
        default: "Enabled"
      }
    }],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance optimization
clientSchema.index({ assignedTo: 1 });
clientSchema.index({ status: 1 });
clientSchema.index({ companyName: 1 });
clientSchema.index({ createdBy: 1 });

module.exports = mongoose.model(
  "Client",
  clientSchema
);
