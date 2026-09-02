const mongoose = require("mongoose");

const OfficeSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: "global",
    unique: true,
    immutable: true,
  },

  startTime: {
    type: String,
    default: "09:00",
    required: true,
    match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Please fill a valid time format (HH:mm)'],
  },

  endTime: {
    type: String,
    default: "19:00",
    required: true,
    match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Please fill a valid time format (HH:mm)'],
    validate: {
      validator(value) {
        if (!this.startTime) return true;
        const [startH, startM] = this.startTime.split(':').map(Number);
        const [endH, endM] = value.split(':').map(Number);
        return endH > startH || (endH === startH && endM > startM);
      },
      message: "End time must be greater than start time.",
    },
  },

  workingDays: {
    type: [Number],
    default: [1, 2, 3, 4, 5, 6], // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  },

  breakStartTime: {
    type: String,
    default: "13:00",
    match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Please fill a valid time format (HH:mm)'],
  },

  breakEndTime: {
    type: String,
    default: "14:00",
    match: [/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/, 'Please fill a valid time format (HH:mm)'],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model("OfficeSettings", OfficeSettingsSchema);