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

    const now = new Date();
    const { day, hour: currentHour } = getISTDateParts(now);

    const isNonWorkingDay = !workingDays.includes(day);
    const isOutsideHours = currentHour >= endHour || currentHour < startHour;
    const isOutsideBusiness = isNonWorkingDay || isOutsideHours;

    if (isOutsideBusiness) {
      // OUTSIDE OFFICE HOURS -> Auto-pause active tasks (status remains "In Progress", autoPaused = true)
      const dateStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      const hourStr = String(endHour).padStart(2, "0");
      let pauseTime = new Date(`${dateStr}T${hourStr}:00:00+05:30`);
      if (pauseTime > now) {
        pauseTime = new Date(now);
      }

      // 1. Parent tasks with status "In Progress" or legacy autoPaused "On Hold"
      const activeTasks = await Task.find({
        $or: [
          { status: "In Progress", autoPaused: { $ne: true } },
          { status: "On Hold", autoPaused: true }
        ]
      });

      for (let task of activeTasks) {
        task.status = "In Progress";
        task.pausedAt = task.pausedAt || pauseTime;
        task.autoPaused = true;
        await task.save();
        
        console.log(`Auto-paused task: "${task.title}" at ${task.pausedAt}`);
        if (io) {
          io.emit("task_updated", { taskId: task._id });
        }
      }

      // 2. Subtasks in progress
      const tasksWithActiveSubtasks = await Task.find({
        $or: [
          { "subtasks.status": "In Progress", "subtasks.autoPaused": { $ne: true } },
          { "subtasks.status": "On Hold", "subtasks.autoPaused": true }
        ]
      });

      for (let task of tasksWithActiveSubtasks) {
        let updated = false;
        task.subtasks = task.subtasks.map(sub => {
          if ((sub.status === "In Progress" && !sub.autoPaused) || (sub.status === "On Hold" && sub.autoPaused)) {
            sub.status = "In Progress";
            sub.pausedAt = sub.pausedAt || pauseTime;
            sub.autoPaused = true;
            updated = true;
            console.log(`Auto-paused subtask: "${sub.title}" in task "${task.title}"`);
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
    } else {
      // INSIDE OFFICE HOURS -> Auto-resume autoPaused tasks
      const tasksToResume = await Task.find({ autoPaused: true });

      for (let task of tasksToResume) {
        if (task.status === "In Progress" || task.status === "On Hold") {
          if (task.pausedAt) {
            const pauseDurationMs = now.getTime() - new Date(task.pausedAt).getTime();
            if (pauseDurationMs > 0) {
              task.totalPausedMs = (task.totalPausedMs || 0) + pauseDurationMs;
              task.businessTotalPausedMs = (task.businessTotalPausedMs || 0) + calculateBusinessMs(task.pausedAt, now, startHour, endHour, workingDays);
            }
          }
          task.status = "In Progress";
          task.autoPaused = false;
          task.pausedAt = null;
          await task.save();

          console.log(`Auto-resumed task: "${task.title}" at 9:00 AM working hours`);
          if (io) {
            io.emit("task_updated", { taskId: task._id });
          }
        }
      }

      // Subtasks auto-resume
      const tasksWithSubtasksToResume = await Task.find({ "subtasks.autoPaused": true });
      for (let task of tasksWithSubtasksToResume) {
        let updated = false;
        task.subtasks = task.subtasks.map(sub => {
          if (sub.autoPaused) {
            if (sub.pausedAt) {
              const pauseDurationMs = now.getTime() - new Date(sub.pausedAt).getTime();
              if (pauseDurationMs > 0) {
                sub.totalPausedMs = (sub.totalPausedMs || 0) + pauseDurationMs;
                sub.businessTotalPausedMs = (sub.businessTotalPausedMs || 0) + calculateBusinessMs(sub.pausedAt, now, startHour, endHour, workingDays);
              }
            }
            sub.status = "In Progress";
            sub.autoPaused = false;
            sub.pausedAt = null;
            updated = true;
            console.log(`Auto-resumed subtask: "${sub.title}" in task "${task.title}"`);
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

