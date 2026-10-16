const mongoose = require('mongoose');

const sessionIntervalSchema = new mongoose.Schema(
  {
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const userDailyActivitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    date: {
      type: String, // Format: YYYY-MM-DD in Asia/Kolkata timezone
      required: true,
      index: true,
    },
    totalOnlineMs: {
      type: Number,
      default: 0,
    },
    currentSessionStart: {
      type: Date,
      default: null,
    },
    firstLogin: {
      type: Date,
      default: null,
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'away'],
      default: 'offline',
    },
    sessions: {
      type: [sessionIntervalSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

userDailyActivitySchema.index({ user: 1, date: 1 }, { unique: true });
userDailyActivitySchema.index({ date: 1 });

module.exports = mongoose.model('UserDailyActivity', userDailyActivitySchema);
