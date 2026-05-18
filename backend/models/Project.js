// models/Project.js

const mongoose = require("mongoose");

const projectSchema =
  new mongoose.Schema(
    {
      // PROJECT NAME
      title: {
        type: String,
        required: [
          true,
          "Project title is required",
        ],
        trim: true,
      },



      // CLIENT
      client: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Client",

        required: [
          true,
          "Client is required",
        ],
      },



      // PROJECT TYPE
      type: {
        type: String,

        enum: [
          "Monthly Retainer",
          "One Time Project",
          "Internal Project",
        ],

        default:
          "Monthly Retainer",
      },



      // TEMPLATE
      template: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "Template",
      },



      // DESCRIPTION
      description: {
        type: String,
        trim: true,
      },



      // STATUS
      status: {
        type: String,

        enum: [
          "Active",
          "In Review",
          "At Risk",
          "Completed",
        ],

        default: "Active",
      },



      // PRIORITY
      priority: {
        type: String,

        enum: [
          "low",
          "medium",
          "high",
        ],

        default: "medium",
      },



      // START DATE
      startDate: {
        type: Date,
      },



      // END DATE
      endDate: {
        type: Date,
      },



      // ASSIGNED USERS
      assignedTo: [
        {
          type:
            mongoose.Schema.Types.ObjectId,

          ref: "User",
        },
      ],



      // CREATED BY
      createdBy: {
        type:
          mongoose.Schema.Types.ObjectId,

        ref: "User",

        required: true,
      },



      // ACTIVE
      isActive: {
        type: Boolean,
        default: true,
      },
    },

    {
      timestamps: true,
    }
  );

module.exports =
  mongoose.model(
    "Project",
    projectSchema
  );