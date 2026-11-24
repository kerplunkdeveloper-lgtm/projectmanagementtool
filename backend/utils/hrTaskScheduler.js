const HrTask = require("../models/HrTask");
const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Checks for HR tasks that are approaching due date (due within next 3 days)
 * and notifies both Manager and HR assignee if not already notified.
 */
async function checkDueSoonHrTasks(io) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const DAY_MS = 24 * 60 * 60 * 1000;
    const windowEnd = new Date(today.getTime() + 4 * DAY_MS); // today + next 3 days

    // Open tasks due within the next 3 days (On Hold tasks are paused, skip them)
    const tasksApproachingDueDate = await HrTask.find({
      dueDate: { $gte: today, $lt: windowEnd },
      status: { $in: ["Not Started", "In Progress"] },
      dueSoonNotified: false,
    }).populate("assignedTo", "name email").populate("createdBy", "name email");

    if (tasksApproachingDueDate.length === 0) return;

    for (const task of tasksApproachingDueDate) {
      const due = new Date(task.dueDate);
      const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
      const daysLeft = Math.round((dueDay - today) / DAY_MS);
      const dueText = daysLeft <= 0 ? "today" : `in ${daysLeft} day(s)`;
      const dueStr = new Date(task.dueDate).toLocaleDateString();

      // Notify Manager
      if (task.createdBy) {
        const notifMgr = await Notification.create({
          recipient: task.createdBy._id,
          sender: task.assignedTo?._id || task.createdBy._id,
          type: "hr_task_due_soon",
          message: `HR Task "${task.title}" assigned to ${task.assignedTo?.name || "HR"} is due ${dueText} (${dueStr})`,
          hrTask: task._id,
        });

        if (io) {
          io.to(task.createdBy._id.toString()).emit("notification", notifMgr);
          io.to(task.createdBy._id.toString()).emit("new_notification", notifMgr);
        }
      }

      // Notify HR Assignee
      if (task.assignedTo && task.assignedTo._id.toString() !== task.createdBy?._id.toString()) {
        const notifHr = await Notification.create({
          recipient: task.assignedTo._id,
          sender: task.createdBy?._id || task.assignedTo._id,
          type: "hr_task_due_soon",
          message: `Reminder: HR Task "${task.title}" is due ${dueText} (${dueStr})`,
          hrTask: task._id,
        });

        if (io) {
          io.to(task.assignedTo._id.toString()).emit("notification", notifHr);
          io.to(task.assignedTo._id.toString()).emit("new_notification", notifHr);
        }
      }

      // Mark as notified so we don't spam
      await HrTask.updateOne({ _id: task._id }, { $set: { dueSoonNotified: true } });
      console.log(`[HrTaskScheduler] Sent due-soon notification for task: "${task.title}"`);
    }
  } catch (error) {
    console.error("[HrTaskScheduler Error]:", error.message);
  }
}

function startHrTaskScheduler(app) {
  // Convert tasks from the old submit/review workflow to the new 4-status model
  const { migrateLegacyStatuses } = require("../controllers/hrTaskController");

  // Check every 10 minutes
  setInterval(() => {
    const io = app.get("io");
    checkDueSoonHrTasks(io);
  }, 10 * 60 * 1000);

  // Run initial check after 10 seconds of startup
  setTimeout(async () => {
    await migrateLegacyStatuses();
    const io = app.get("io");
    checkDueSoonHrTasks(io);
  }, 10000);

  console.log("[HrTaskScheduler] Initialized background worker for due-soon tasks.");
}

module.exports = {
  checkDueSoonHrTasks,
  startHrTaskScheduler,
};
