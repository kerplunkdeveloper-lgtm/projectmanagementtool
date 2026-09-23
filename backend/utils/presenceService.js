const User = require('../models/User');

const handlePresenceChange = async (io, userId, newStatus, lastActivityAt = new Date()) => {
  try {
    if (!userId) return;

    const lastSeenDate = newStatus === 'online' ? new Date() : (lastActivityAt || new Date());
    const updateFields = {
      presenceStatus: newStatus,
      lastSeen: lastSeenDate,
    };
    if (newStatus === 'online') {
      updateFields.lastActivityAt = new Date();
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, select: 'name email presenceStatus lastSeen lastActivityAt' }
    );

    if (!user) return;

    // Broadcast presence change to all connected clients (UI online dots, chat, etc.)
    io.emit('user:presence', {
      userId: userId.toString(),
      status: newStatus,
      lastSeen: user.lastSeen || lastSeenDate,
    });
  } catch (err) {
    console.error('[PresenceService] Error handling presence change:', err);
  }
};

module.exports = {
  handlePresenceChange
};
