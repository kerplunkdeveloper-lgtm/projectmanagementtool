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
        io.emit('task_updated', { taskId: task._id });
      }

      // Also pause any In Progress subtasks assigned to this user
      const tasksWithSubtasksToPause = await Task.find({
        'subtasks.assignedTo': userId,
        'subtasks.status': { $in: ['In Progress', 'In-Progress'] },
        'subtasks.pausedAt': null
      });

      for (const task of tasksWithSubtasksToPause) {
        let changed = false;
        task.subtasks.forEach(sub => {
          const isAssigned = Array.isArray(sub.assignedTo)
            ? sub.assignedTo.some(u => (u?._id || u).toString() === userId.toString())
            : (sub.assignedTo?._id || sub.assignedTo)?.toString() === userId.toString();
          if (isAssigned && (sub.status === 'In Progress' || sub.status === 'In-Progress') && !sub.pausedAt) {
            sub.pausedAt = lastActivityAt || new Date();
            sub.autoPaused = true;
            changed = true;
          }
        });
        if (changed) {
          await task.save();
          io.emit('task_updated', { taskId: task._id });
        }
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
        task.totalPausedMs = (task.totalPausedMs || 0) + pauseDurationMs;
        
        const bizPause = calculateBusinessMs(new Date(task.pausedAt).getTime(), now.getTime(), "09:00", "19:00", [1,2,3,4,5,6]);
        task.businessTotalPausedMs = (task.businessTotalPausedMs || 0) + Math.max(0, bizPause);
        
        task.pausedAt = null;
        task.autoPaused = false;
        await task.save();
        
        resumedAnyTask = true;
        totalOfflineMs = pauseDurationMs;
        io.emit('task_updated', { taskId: task._id });
      }

      // Resume any auto-paused In Progress subtasks
      const tasksWithSubtasksToResume = await Task.find({
        'subtasks.assignedTo': userId,
        'subtasks.status': { $in: ['In Progress', 'In-Progress'] },
        'subtasks.autoPaused': true,
        'subtasks.pausedAt': { $ne: null }
      });

      for (const task of tasksWithSubtasksToResume) {
        let changed = false;
        task.subtasks.forEach(sub => {
          const isAssigned = Array.isArray(sub.assignedTo)
            ? sub.assignedTo.some(u => (u?._id || u).toString() === userId.toString())
            : (sub.assignedTo?._id || sub.assignedTo)?.toString() === userId.toString();
          if (isAssigned && (sub.status === 'In Progress' || sub.status === 'In-Progress') && sub.autoPaused && sub.pausedAt) {
            const pauseDurationMs = now.getTime() - new Date(sub.pausedAt).getTime();
            sub.totalPausedMs = (sub.totalPausedMs || 0) + pauseDurationMs;

            const bizPause = calculateBusinessMs(new Date(sub.pausedAt).getTime(), now.getTime(), "09:00", "19:00", [1,2,3,4,5,6]);
            sub.businessTotalPausedMs = (sub.businessTotalPausedMs || 0) + Math.max(0, bizPause);

            sub.pausedAt = null;
            sub.autoPaused = false;
            changed = true;
            resumedAnyTask = true;
            totalOfflineMs = pauseDurationMs;
          }
        });
        if (changed) {
          await task.save();
          io.emit('task_updated', { taskId: task._id });
        }
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
