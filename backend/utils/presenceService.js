const User = require('../models/User');
const Task = require('../models/Task');
const OfficeSettings = require('../models/OfficeSettings');
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
      const now = new Date();
      const currentDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

      let settings = await OfficeSettings.findOne({ key: "global" });
      const startHour = settings?.startHour ?? 9;
      const endHour = settings?.endHour ?? 19;
      const workingDays = settings?.workingDays && settings.workingDays.length > 0 ? settings.workingDays : [1, 2, 3, 4, 5, 6];
      const startHourStr = `${String(startHour).padStart(2, "0")}:00`;
      const endHourStr = `${String(endHour).padStart(2, "0")}:00`;

      // Find any auto-paused In Progress tasks assigned to this user
      const tasksToProcess = await Task.find({
        assignedTo: userId,
        status: { $in: ['In Progress', 'In-Progress'] },
        autoPaused: true,
      });

      let resumedAnyTask = false;
      let totalOfflineMs = 0;

      for (const task of tasksToProcess) {
        const pausedDateStr = task.pausedAt
          ? new Date(task.pausedAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
          : null;
        const isSameDay = pausedDateStr === currentDateStr;

        if (isSameDay && task.pausedAt) {
          // SAME-DAY AWAY RESUME: User stepped away for a few minutes today -> resume timer
          const pauseDurationMs = Math.max(0, now.getTime() - new Date(task.pausedAt).getTime());
          task.totalPausedMs = (task.totalPausedMs || 0) + pauseDurationMs;
          
          const bizPause = calculateBusinessMs(new Date(task.pausedAt).getTime(), now.getTime(), startHourStr, endHourStr, workingDays);
          task.businessTotalPausedMs = (task.businessTotalPausedMs || 0) + Math.max(0, bizPause);
          
          task.pausedAt = null;
          task.autoPaused = false;
          await task.save();
          
          resumedAnyTask = true;
          totalOfflineMs = pauseDurationMs;
          io.emit('task_updated', { taskId: task._id });
        } else {
          // OVERNIGHT / PREVIOUS DAY: Do NOT auto-resume into In Progress on morning shift start!
          // Put the task On Hold so user explicitly starts what they want to work on.
          let history = task.statusHistory ? JSON.parse(JSON.stringify(task.statusHistory)) : [];
          let sessionWorkedMs = 0;
          const closeTime = task.pausedAt ? new Date(task.pausedAt) : now;
          if (task.actualStartTime) {
            const sStart = new Date(task.actualStartTime).getTime();
            sessionWorkedMs = Math.max(0, calculateBusinessMs(sStart, closeTime.getTime(), startHourStr, endHourStr, workingDays));
          }

          for (let i = history.length - 1; i >= 0; i--) {
            if (!history[i].endTime && (history[i].status === "In Progress" || history[i].status === "In-Progress")) {
              history[i].endTime = closeTime;
              history[i].duration = Math.max(0, Math.round(sessionWorkedMs));
              break;
            }
          }

          history.push({
            status: "On Hold",
            startTime: closeTime,
            updatedBy: "System",
            reason: "Shift ended / Auto-paused overnight"
          });

          task.totalTrackedTime = (task.totalTrackedTime || 0) + sessionWorkedMs;
          task.status = "On Hold";
          task.statusHistory = history;
          task.actualStartTime = null;
          task.pausedAt = null;
          task.autoPaused = false;
          await task.save();
          io.emit('task_updated', { taskId: task._id });
        }
      }

      // Process subtasks
      const tasksWithSubtasks = await Task.find({
        'subtasks.assignedTo': userId,
        'subtasks.status': { $in: ['In Progress', 'In-Progress'] },
        'subtasks.autoPaused': true,
      });

      for (const task of tasksWithSubtasks) {
        let changed = false;
        task.subtasks.forEach(sub => {
          const isAssigned = Array.isArray(sub.assignedTo)
            ? sub.assignedTo.some(u => (u?._id || u).toString() === userId.toString())
            : (sub.assignedTo?._id || sub.assignedTo)?.toString() === userId.toString();

          if (isAssigned && (sub.status === 'In Progress' || sub.status === 'In-Progress') && sub.autoPaused) {
            const pausedDateStr = sub.pausedAt
              ? new Date(sub.pausedAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
              : null;
            const isSameDay = pausedDateStr === currentDateStr;

            if (isSameDay && sub.pausedAt) {
              const pauseDurationMs = Math.max(0, now.getTime() - new Date(sub.pausedAt).getTime());
              sub.totalPausedMs = (sub.totalPausedMs || 0) + pauseDurationMs;

              const bizPause = calculateBusinessMs(new Date(sub.pausedAt).getTime(), now.getTime(), startHourStr, endHourStr, workingDays);
              sub.businessTotalPausedMs = (sub.businessTotalPausedMs || 0) + Math.max(0, bizPause);

              sub.pausedAt = null;
              sub.autoPaused = false;
              changed = true;
              resumedAnyTask = true;
              totalOfflineMs = pauseDurationMs;
            } else {
              // OVERNIGHT / PREVIOUS DAY Subtask -> On Hold
              let history = sub.statusHistory ? JSON.parse(JSON.stringify(sub.statusHistory)) : [];
              let sessionWorkedMs = 0;
              const closeTime = sub.pausedAt ? new Date(sub.pausedAt) : now;
              if (sub.actualStartTime) {
                const sStart = new Date(sub.actualStartTime).getTime();
                sessionWorkedMs = Math.max(0, calculateBusinessMs(sStart, closeTime.getTime(), startHourStr, endHourStr, workingDays));
              }

              for (let i = history.length - 1; i >= 0; i--) {
                if (!history[i].endTime && (history[i].status === "In Progress" || history[i].status === "In-Progress")) {
                  history[i].endTime = closeTime;
                  history[i].duration = Math.max(0, Math.round(sessionWorkedMs));
                  break;
                }
              }

              history.push({
                status: "On Hold",
                startTime: closeTime,
                updatedBy: "System",
                reason: "Shift ended / Auto-paused overnight"
              });

              sub.totalTrackedTime = (sub.totalTrackedTime || 0) + sessionWorkedMs;
              sub.status = "On Hold";
              sub.statusHistory = history;
              sub.actualStartTime = null;
              sub.pausedAt = null;
              sub.autoPaused = false;
              changed = true;
            }
          }
        });

        if (changed) {
          await task.save();
          io.emit('task_updated', { taskId: task._id });
        }
      }

      // If we resumed a SAME-DAY task, emit the welcome back event
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
