const mongoose = require('mongoose');

const subtaskItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: false }
);

const scheduleSlotSchema = new mongoose.Schema(
  {
    slotId: { type: String, required: true },
    timeRange: { type: String, required: true },
    startTime: { type: String, required: true }, // e.g. "09:00"
    endTime: { type: String, required: true },   // e.g. "09:15"
    title: { type: String, required: true },
    points: [{ type: String }],
    benchmark: { type: String, default: '' },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedByName: { type: String, default: '' },
    isOnTime: { type: Boolean, default: false },
    timingStatus: {
      type: String,
      enum: ['pending', 'on-time', 'early', 'delayed'],
      default: 'pending',
    },
    notes: { type: String, default: '' },
    // Why the slot was left incomplete; required for every pending slot when the day is submitted
    pendingReason: { type: String, default: '', maxlength: 500 },
    subtasks: [subtaskItemSchema],
  },
  { _id: false }
);

const smDailyScheduleSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: { type: String, default: '' },
    userDepartment: { type: String, default: '' },
    date: {
      type: String, // Format: YYYY-MM-DD
      required: true,
      index: true,
    },
    slots: [scheduleSlotSchema],
    completedSlotsCount: { type: Number, default: 0 },
    totalSlotsCount: { type: Number, default: 15 },
    completionPercentage: { type: Number, default: 0 },
    onTimeSlotsCount: { type: Number, default: 0 },
    earlySlotsCount: { type: Number, default: 0 },
    delayedSlotsCount: { type: Number, default: 0 },

    // End-of-day submission. A submitted day is read-only until leadership reopens it.
    isSubmitted: { type: Boolean, default: false },
    submittedAt: { type: Date, default: null },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submittedByName: { type: String, default: '' },
    submissionNote: { type: String, default: '', maxlength: 1000 },
    reopenedAt: { type: Date, default: null },
    reopenedByName: { type: String, default: '' },
  },
  {
    timestamps: true,
    // Concurrent toggles on the same day must not overwrite each other's changes or counts:
    // a save based on stale data throws VersionError and the controller retries on fresh data.
    optimisticConcurrency: true,
  }
);

smDailyScheduleSchema.index({ user: 1, date: 1 }, { unique: true });
smDailyScheduleSchema.index({ date: 1, user: 1 });

module.exports = mongoose.model('SmDailySchedule', smDailyScheduleSchema);

