const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({

  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
  },

  description: {
    type: String,
    trim: true,
  },



  department: {
    type: String,

    enum: [
      "Social Media Team",
      "Website Team",
      "Designer Team",
      "Editor Team",
      "Scriptwriter Team",
      "Cameraman Team",
      "SEO Team",
    ],
  },



  // PROJECT STATUS
  status: {
    type: String,

    enum: [
      'planning',
      'in-progress',
      'completed',
      'on-hold',
    ],

    default: 'planning',
  },



  // PROJECT PRIORITY
  priority: {
    type: String,

    enum: [
      'low',
      'medium',
      'high',
    ],

    default: 'medium',
  },



  // ASSIGNED TEAM MEMBERS
  assignedTo: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],



  deadline: {
    type: Date,
  },



  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },



  createdAt: {
    type: Date,
    default: Date.now,
  },



  updatedAt: {
    type: Date,
    default: Date.now,
  },

}, {
  timestamps: true,
});

module.exports = mongoose.model('Project', projectSchema);