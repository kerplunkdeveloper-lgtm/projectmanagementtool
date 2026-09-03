const User = require('../models/User');
const Task = require('../models/Task');
const { calculateBusinessMs } = require('./businessHours');

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

    // 2. Broadcast presence change
    io.emit('user:presence', {
      userId: userId.toString(),
      status: newStatus,
      lastSeen: user.lastSeen,
    });

    // 3. Handle task auto-pausing/resuming
    if (newStatus === 'away' || newStatus === 'offline') {
      // Pause any In Progress tasks that are NOT already paused
      const tasksToPause = await Task.find({
        assignedTo: userId,
        status: { $in: ['In Progress', 'In-Progress'] },
        pausedAt: null
      });

      for (const task of tasksToPause) {
        task.pausedAt = lastActivityAt || new Date();
        task.autoPaused = true;
        await task.save();
      }
    } else if (newStatus === 'online' && (oldStatus === 'away' || oldStatus === 'offline')) {
      // Resume any auto-paused In Progress tasks
      const tasksToResume = await Task.find({
        assignedTo: userId,
        status: { $in: ['In Progress', 'In-Progress'] },
        autoPaused: true,
        pausedAt: { $ne: null }
      });

      let resumedAnyTask = false;
      let totalOfflineMs = 0;

      const now = new Date();
      for (const task of tasksToResume) {
        const pauseDurationMs = now.getTime() - new Date(task.pausedAt).getTime();
        
        // Calculate business ms paused to not penalize off-hours if we track business pause
        // In simple terms, just add to totalPausedMs
        task.totalPausedMs = (task.totalPausedMs || 0) + pauseDurationMs;
        
        // Try calculating business pause time if startHour/endHour exist (defaults)
        const bizPause = calculateBusinessMs(new Date(task.pausedAt).getTime(), now.getTime(), 9, 19, [1,2,3,4,5,6]);
        task.businessTotalPausedMs = (task.businessTotalPausedMs || 0) + Math.max(0, bizPause);
        
        task.pausedAt = null;
        task.autoPaused = false;
        await task.save();
        
        resumedAnyTask = true;
        totalOfflineMs = pauseDurationMs; // assume roughly same for all tasks of this user
      }

      // If we resumed a task, emit the welcome back event
      if (resumedAnyTask) {
        io.to(userId.toString()).emit('productivity_resumed', {
          durationMs: totalOfflineMs,
          previousStatus: oldStatus
        });
      }
    }
  } catch (err) {
    console.error('[PresenceService] Error handling presence change:', err);
  }
};

module.exports = {
  handlePresenceChange
};
