const User = require('../models/User');
const Task = require('../models/Task');

const handlePresenceChange = async (io, userId, newStatus, lastActivityAt = new Date()) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const oldStatus = user.presenceStatus || 'offline';
    if (oldStatus === newStatus) return; // No change

    // 1. Update user document
    user.presenceStatus = newStatus;
    if (newStatus === 'online') {
      user.lastActivityAt = new Date();
      user.lastSeen = new Date();
    } else {
      user.lastSeen = lastActivityAt; // when they were last active/connected
    }
    await user.save();

    // 2. Broadcast presence change (for UI online indicators, chat, etc.)
    io.emit('user:presence', {
      userId: userId.toString(),
      status: newStatus,
      lastSeen: user.lastSeen,
    });

    // NOTE: Idle timeout / away status no longer auto-pauses tasks.
    // Tasks stay In Progress until user manually pauses/completes them, or Office Hours ends.
  } catch (err) {
    console.error('[PresenceService] Error handling presence change:', err);
  }
};

module.exports = {
  handlePresenceChange
};

