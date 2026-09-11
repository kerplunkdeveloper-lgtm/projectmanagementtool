const mongoose = require('mongoose');

const CalendarEventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      enum: [
        'Client Meeting',
        'Birthday',
        'Team Outing',
        'Holiday',
        'Personal',
        'Other',
      ],
      default: 'Other',
    },
    date: {
      type: Date,
      required: [true, 'Please add a date'],
    },
    endDate: {
      type: Date,
    },
    allDay: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    client: {
      type: mongoose.Schema.ObjectId,
      ref: 'Client',
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient date-range queries
CalendarEventSchema.index({ date: 1 });
CalendarEventSchema.index({ createdBy: 1 });
CalendarEventSchema.index({ category: 1 });

module.exports = mongoose.model('CalendarEvent', CalendarEventSchema);
