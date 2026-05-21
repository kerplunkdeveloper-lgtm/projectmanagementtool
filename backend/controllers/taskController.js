const Task = require("../models/Task");
const Notification = require("../models/Notification");

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("project", "name client")
      .populate("assignedTo", "name email profileImage")
      .populate("subtasks.assignedTo", "name email profileImage");

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private/Admin/OperationManager
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name client")
      .populate("assignedTo", "name email profileImage")
      .populate("subtasks.assignedTo", "name email profileImage");

    // Real-time Notification
    if (task.assignedTo) {
      const notification = await Notification.create({
        recipient: task.assignedTo,
        sender: req.user.id,
        type: "task_assigned",
        message: `You have been assigned a new task: "${task.title}"`,
        task: task._id,
        project: task.project,
      });

      const io = req.app.get("io");
      if (io) {
        const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
        io.to(task.assignedTo.toString()).emit("notification", populatedNotification);
      }
    }

    res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update a task (including status or adding subtasks)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const previousStatus = task.status;
    const previousAssignee = task.assignedTo;

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("project", "name client")
      .populate("assignedTo", "name email profileImage")
      .populate("subtasks.assignedTo", "name email profileImage");

    // Check if task status has been updated (e.g. marked completed)
    if (req.body.status && req.body.status !== previousStatus) {
      // Notify task assignee if admin updated it, or notify creator/admin if assignee updated it
      const recipient = req.user.id === task.assignedTo?._id?.toString() ? task.project?.client : task.assignedTo?._id;
      
      if (recipient) {
        const notification = await Notification.create({
          recipient,
          sender: req.user.id,
          type: "task_updated",
          message: `Task "${task.title}" status updated to: ${task.status}`,
          task: task._id,
          project: task.project?._id,
        });

        const io = req.app.get("io");
        if (io) {
          const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
          io.to(recipient.toString()).emit("notification", populatedNotification);
        }
      }
    }

    // Check if task has been assigned to a different user
    if (req.body.assignedTo && req.body.assignedTo.toString() !== previousAssignee?.toString()) {
      const notification = await Notification.create({
        recipient: req.body.assignedTo,
        sender: req.user.id,
        type: "task_assigned",
        message: `You have been assigned the task: "${task.title}"`,
        task: task._id,
        project: task.project?._id,
      });

      const io = req.app.get("io");
      if (io) {
        const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
        io.to(req.body.assignedTo.toString()).emit("notification", populatedNotification);
      }
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin/OperationManager
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
