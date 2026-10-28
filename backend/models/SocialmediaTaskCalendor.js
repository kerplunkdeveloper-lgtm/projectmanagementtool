const mongoose = require('mongoose');

const socialmediaTaskCalendorSchema = new mongoose.Schema(
  {
    taskCode: {
      type: String,
      trim: true,
      index: true,
    },
    taskTitle: {
      type: String,
      required: [true, 'Please provide task title'],
      trim: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      default: null,
    },
    clientName: {
      type: String,
      required: [true, 'Please specify client name'],
      trim: true,
    },
    clientColor: {
      type: String,
      default: '#6366f1',
    },
    category: {
      type: String,
      enum: ['Content', 'Copy', 'Posting', 'Engagement', 'Client', 'Ads', 'Strategy', 'Reporting', 'Calendar', 'Audit', 'Other'],
      default: 'Content',
    },
    contentType: {
      type: String,
      enum: ['Reel', 'Post', 'Carousel', 'Story', 'GMB', 'YouTube', 'Blog', 'Ad', 'Other'],
      default: 'Post',
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    assigneeName: {
      type: String,
      default: 'Unassigned',
      trim: true,
    },
    dueDate: {
      type: Date,
      required: [true, 'Please set a due date'],
      default: Date.now,
    },
    publishDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['Not started', 'In progress', 'In QC', 'Scheduled', 'Overdue', 'Completed', 'Live'],
      default: 'Not started',
    },
    priority: {
      type: String,
      enum: ['High', 'Medium', 'Low'],
      default: 'Medium',
    },
    qc: {
      type: String,
      enum: ['Pending', 'Passed', 'Rejected', '-'],
      default: '-',
    },
    // Rule: Set by system when publish date exists. Never typed.
    commitment: {
      type: Boolean,
      default: false,
    },
    // Rule: On calendar when publish date exists
    onCalendar: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    createdByName: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: At risk logic -> Commitment is YES + due within 24 hours + not completed
socialmediaTaskCalendorSchema.virtual('isAtRisk').get(function () {
  if (!this.commitment) return false;
  if (['Completed', 'Live'].includes(this.status)) return false;

  const targetDate = this.publishDate || this.dueDate;
  if (!targetDate) return false;

  const now = new Date();
  const diffHours = (new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60);

  // If due within next 24 hours (not already overdue)
  return diffHours >= 0 && diffHours <= 24;
});

// Pre-save hook: auto-sync commitment, onCalendar and taskCode
socialmediaTaskCalendorSchema.pre('save', function () {
  // If publishDate is valid, commitment and onCalendar must be true
  if (this.publishDate && !isNaN(new Date(this.publishDate).getTime())) {
    this.commitment = true;
    this.onCalendar = true;
  } else {
    this.commitment = false;
    this.onCalendar = false;
    this.publishDate = null;
  }

  // Auto-generate taskCode if not present
  if (!this.taskCode) {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    this.taskCode = `SRT-${randomNum}`;
  }
});

// Indexes for query performance
socialmediaTaskCalendorSchema.index({ publishDate: 1 });
socialmediaTaskCalendorSchema.index({ dueDate: 1 });
socialmediaTaskCalendorSchema.index({ status: 1 });
socialmediaTaskCalendorSchema.index({ commitment: 1 });
socialmediaTaskCalendorSchema.index({ category: 1 });
socialmediaTaskCalendorSchema.index({ clientName: 1 });

module.exports = mongoose.model('SocialmediaTaskCalendor', socialmediaTaskCalendorSchema);
