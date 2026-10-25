const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: [
      'task_assigned', 'task_updated', 'project_assigned', 'client_assigned', 'general',
      'message_received', 'mention_received', 'reaction_received', 'report_submitted',
      'client_call_created', 'shoot_assigned', 'mom_created', 'mom_assigned', 'mom_overdue', 'mom_updated',
      'hr_task_assigned', 'hr_task_updated', 'hr_task_submitted', 'hr_task_reviewed', 'hr_task_blocker', 'hr_task_due_soon', 'hr_task_cancelled', 'hr_task_comment'
    ],
    default: 'general',
  },
  message: {
    type: String,
    required: true,
  },
  task: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
  },
  hrTask: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'HrTask',
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
  },
  clientName: {
    type: String,
    default: '',
  },
  shoot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shoot',
  },
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
  },
  mom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mom',
  },
  chatRoomId: {
    type: String,
  },
  chatRoomType: {
    type: String,
  },
  roomName: {
    type: String,
  },
  messageData: {
    text: { type: String },
    messageType: { type: String },
    filename: { type: String },
    sticker: { type: String },
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Optimize queries for finding user notifications, sorting by date, and checking unread counts
NotificationSchema.index({ recipient: 1, isRead: 1, type: 1 });
NotificationSchema.index({ recipient: 1, chatRoomId: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ createdAt: -1 });

NotificationSchema.pre('save', async function () {
  if (this.recipient) {
    const User = mongoose.model('User');
    const user = await User.findById(this.recipient).select('employmentStatus accountStatus');
    if (user && (user.employmentStatus === 'relieved' || user.accountStatus === 'inactive')) {
      const err = new Error('Recipient is relieved/inactive. Notification suppressed.');
      err.name = 'NotificationSuppressed';
      throw err;
    }
  }
});

module.exports = mongoose.model('Notification', NotificationSchema);
