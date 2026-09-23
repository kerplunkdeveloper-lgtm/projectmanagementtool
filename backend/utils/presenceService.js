const User = require('../models/User');

const handlePresenceChange = async (io, userId, newStatus, lastActivityAt = new Date()) => {
  try {
    // Use findOneAndUpdate for atomic read-modify-write (prevents race condition
    // when multiple sockets disconnect simultaneously for the same user).
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          presenceStatus: newStatus,
          lastSeen: newStatus === 'online' ? new Date() : lastActivityAt,
          ...(newStatus === 'online' ? { lastActivityAt: new Date() } : {}),
        },
      },
      { new: true }
    );

    if (!user) return;

    // Broadcast presence change to all connected clients (UI online dots, chat, etc.)
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
