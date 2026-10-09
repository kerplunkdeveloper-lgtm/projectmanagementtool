const mongoose = require('mongoose');

const momSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Please add a MOM title'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    momType: {
      type: String,
      required: [true, 'Please select a MOM type'],
      enum: [
        'Task / Action',
        'Client Decision',
        'Follow-up',
        'Discussion',
        'Information',
        'Client Feedback',
        'Design Change',
        'Content Requirement',
        'Correction',
        'Approval / Decision',
        'Issue / Blocker',
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },

    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'In Review', 'Not Started', 'Completed', 'On Hold', 'Cancelled', 'Not started', 'Inprogress', 'In-Review', 'Rejected'],
      default: 'Not Started',
    },
    feedback: {
      type: String,
      default: '',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    overdueNotified: {
      type: Boolean,
      default: false,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Mom', momSchema);
