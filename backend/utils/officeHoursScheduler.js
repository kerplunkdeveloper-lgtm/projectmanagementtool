const Task = require("../models/Task");
const OfficeSettings = require("../models/OfficeSettings");
const { getISTDateParts, calculateBusinessMs } = require("./businessHours");

async function checkAndAutoPauseTasks(io) {
  try {
    let settings = await OfficeSettings.findOne({ key: "global" });
    if (!settings) {
      settings = await OfficeSettings.create({
        key: "global",
        startHour: 9,
        endHour: 19,
        workingDays: [1, 2, 3, 4, 5, 6],
      });
    }

    const workingDays = settings.workingDays && settings.workingDays.length > 0
      ? settings.workingDays
      : [1, 2, 3, 4, 5, 6];
    const startHour = settings.startHour ?? 9;
    const endHour = settings.endHour ?? 19;
    const startHourStr = `${String(startHour).padStart(2, "0")}:00`;
    const endHourStr = `${String(endHour).padStart(2, "0")}:00`;

    const now = new Date();
    const { day, hour: currentHour } = getISTDateParts(now);
    const currentDateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

    const isNonWorkingDay = !workingDays.includes(day);
    const isOutsideHours = currentHour >= endHour || currentHour < startHour;
    const isOutsideBusiness = isNonWorkingDay || isOutsideHours;

    const dateStr = now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    const hourStr = String(endHour).padStart(2, "0");
    let pauseTime = new Date(`${dateStr}T${hourStr}:00:00+05:30`);
    if (pauseTime > now) {
      pauseTime = new Date(now);
    }
    const pauseTimeMs = pauseTime.getTime();

    // 1. Process Parent tasks with status "In Progress" or autoPaused
    const activeTasks = await Task.find({
      $or: [
        { status: { $in: ["In Progress", "In-Progress"] } },
        { autoPaused: true }
      ]
    });

    for (let task of activeTasks) {
      const taskStartDay = task.actualStartTime
        ? new Date(task.actualStartTime).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
        : null;
      const taskPausedDay = task.pausedAt
        ? new Date(task.pausedAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
        : null;
      const isFromPreviousDay = (taskStartDay && taskStartDay !== currentDateStr) || (taskPausedDay && taskPausedDay !== currentDateStr);

      // Should auto-pause if we are currently outside office hours OR if this task is lingering from a previous day
      if (isOutsideBusiness || isFromPreviousDay) {
        let history = task.statusHistory ? JSON.parse(JSON.stringify(task.statusHistory)) : [];
        let hasOpenSession = false;
        let sessionWorkedMs = 0;

        const effectiveEndTime = isFromPreviousDay && task.pausedAt ? new Date(task.pausedAt) : pauseTime;

        if (task.actualStartTime) {
          const sStart = new Date(task.actualStartTime).getTime();
          sessionWorkedMs = Math.max(0, calculateBusinessMs(sStart, effectiveEndTime.getTime(), startHourStr, endHourStr, workingDays));
        }

        for (let i = history.length - 1; i >= 0; i--) {
          if (!history[i].endTime && (history[i].status === "In Progress" || history[i].status === "In-Progress")) {
            history[i].endTime = effectiveEndTime;
            history[i].duration = Math.max(0, Math.round(sessionWorkedMs));
            hasOpenSession = true;
            break;
          }
        }

        history.push({
          status: "On Hold",
          startTime: effectiveEndTime,
          updatedBy: "System",
          reason: isOutsideBusiness ? "Office hours ended" : "Shift ended / Overnight pause"
        });

        task.totalTrackedTime = (task.totalTrackedTime || 0) + sessionWorkedMs;
        if (!isFromPreviousDay) {
          task.dailyTrackedTime = (task.dailyTrackedTime || 0) + sessionWorkedMs;
        }

        task.status = "On Hold";
        task.statusHistory = history;
        task.actualStartTime = null;
        task.autoPaused = false;
        task.pausedAt = null;

        await task.save();
        console.log(`[OfficeHoursScheduler] Auto-closed session for task: "${task.title}" at ${effectiveEndTime}`);
        if (io) {
          io.emit("task_updated", { taskId: task._id });
        }
      }
    }

    // 2. Process Subtasks in progress or autoPaused
    const tasksWithSubtasks = await Task.find({
      $or: [
        { "subtasks.status": { $in: ["In Progress", "In-Progress"] } },
        { "subtasks.autoPaused": true }
      ]
    });

    for (let task of tasksWithSubtasks) {
      let updated = false;
      task.subtasks = task.subtasks.map(sub => {
        const subStartDay = sub.actualStartTime
          ? new Date(sub.actualStartTime).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
          : null;
        const subPausedDay = sub.pausedAt
          ? new Date(sub.pausedAt).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
          : null;
        const isFromPreviousDay = (subStartDay && subStartDay !== currentDateStr) || (subPausedDay && subPausedDay !== currentDateStr);

        if ((sub.status === "In Progress" || sub.status === "In-Progress" || sub.autoPaused) && (isOutsideBusiness || isFromPreviousDay)) {
          let history = sub.statusHistory ? JSON.parse(JSON.stringify(sub.statusHistory)) : [];
          let sessionWorkedMs = 0;
          const effectiveEndTime = isFromPreviousDay && sub.pausedAt ? new Date(sub.pausedAt) : pauseTime;

          if (sub.actualStartTime) {
            const sStart = new Date(sub.actualStartTime).getTime();
            sessionWorkedMs = Math.max(0, calculateBusinessMs(sStart, effectiveEndTime.getTime(), startHourStr, endHourStr, workingDays));
          }

          for (let i = history.length - 1; i >= 0; i--) {
            if (!history[i].endTime && (history[i].status === "In Progress" || history[i].status === "In-Progress")) {
              history[i].endTime = effectiveEndTime;
              history[i].duration = Math.max(0, Math.round(sessionWorkedMs));
              break;
            }
          }

          history.push({
            status: "On Hold",
            startTime: effectiveEndTime,
            updatedBy: "System",
            reason: isOutsideBusiness ? "Office hours ended" : "Shift ended / Overnight pause"
          });

          sub.totalTrackedTime = (sub.totalTrackedTime || 0) + sessionWorkedMs;
          if (!isFromPreviousDay) {
            sub.dailyTrackedTime = (sub.dailyTrackedTime || 0) + sessionWorkedMs;
          }

          sub.status = "On Hold";
          sub.statusHistory = history;
          sub.actualStartTime = null;
          sub.autoPaused = false;
          sub.pausedAt = null;
          updated = true;
          console.log(`[OfficeHoursScheduler] Auto-closed session for subtask: "${sub.title}" in task "${task.title}"`);
        }
        return sub;
      });

      if (updated) {
        await task.save();
        if (io) {
          io.emit("task_updated", { taskId: task._id });
        }
      }
    }
  } catch (err) {
    console.error("Error in checkAndAutoPauseTasks background worker:", err);
  }
}

function startOfficeHoursScheduler(app) {
  // Run check immediately at server start
  const io = app.get("io");
  checkAndAutoPauseTasks(io);

  // Check every 60 seconds
  setInterval(() => {
    const currentIo = app.get("io");
    checkAndAutoPauseTasks(currentIo);
  }, 60 * 1000);
}

module.exports = { startOfficeHoursScheduler, checkAndAutoPauseTasks };


