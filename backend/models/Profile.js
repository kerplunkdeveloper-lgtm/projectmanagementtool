const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  skills: [String],
  experience: {
    type: Number,
    default: 0,
  },
  department: String,
  phone: String,
  address: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Profile', profileSchema);