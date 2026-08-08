const Task = require("../models/Task");
const OfficeSettings = require("../models/OfficeSettings");

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
    } else if (!settings.workingDays || settings.workingDays.length === 0 || !settings.workingDays.includes(6)) {
      settings.workingDays = [1, 2, 3, 4, 5, 6];
      await settings.save();
    }

    const now = new Date();
    const day = now.getDay();
    const currentHour = now.getHours();

    const workingDays = settings.workingDays;
    const isNonWorkingDay = !workingDays.includes(day);
    const isOutsideHours = currentHour >= settings.endHour || currentHour < settings.startHour;

    if (isNonWorkingDay || isOutsideHours) {
      // Find tasks in progress
      const activeTasks = await Task.find({ status: "In Progress" });
      
      let pauseTime = new Date();
      if (currentHour >= settings.endHour) {
        pauseTime.setHours(settings.endHour, 0, 0, 0);
      }

      for (let task of activeTasks) {
        task.status = "On Hold";
        task.pausedAt = pauseTime;
        task.autoPaused = true;
        await task.save();
        
        console.log(`Auto-paused task: "${task.title}" at ${pauseTime}`);
        if (io) {
          io.emit("task_updated", { taskId: task._id });
        }
      }

      // Find tasks with subtasks in progress
      const tasksWithActiveSubtasks = await Task.find({ "subtasks.status": "In Progress" });
      for (let task of tasksWithActiveSubtasks) {
        let updated = false;
        task.subtasks = task.subtasks.map(sub => {
          if (sub.status === "In Progress") {
            sub.status = "On Hold";
            sub.pausedAt = pauseTime;
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
      // During active office hours, clear any stale autoPaused flags from DB so popups stop appearing
      await Task.updateMany({ autoPaused: true }, { $set: { autoPaused: false } });
      await Task.updateMany(
        { "subtasks.autoPaused": true },
        { $set: { "subtasks.$[elem].autoPaused": false } },
        { arrayFilters: [{ "elem.autoPaused": true }] }
      );
    }
  } catch (err) {
    console.error("Error in checkAndAutoPauseTasks background worker:", err);
  }
}

function startOfficeHoursScheduler(app) {
  // Check every 60 seconds
  setInterval(() => {
    const io = app.get("io");
    checkAndAutoPauseTasks(io);
  }, 60 * 1000);
}

module.exports = { startOfficeHoursScheduler, checkAndAutoPauseTasks };
