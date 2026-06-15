const Task = require("../models/Task");
const Notification = require("../models/Notification");
const User = require("../models/User");
const Project = require("../models/Project");

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== "admin") {
      let projectIds = [];
      if (req.user.department) {
        const usersInSameDept = await User.find({ department: req.user.department }).select("_id");
        const userIds = usersInSameDept.map(u => u._id);
        const projectsInDept = await Project.find({ createdBy: { $in: userIds } }).select("_id");
        projectIds = projectsInDept.map(p => p._id);
      }
      query.$or = [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
        { project: { $in: projectIds } }
      ];
    }
    const tasks = await Task.find(query)
      .populate("project", "name client")
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email profileImage")
      .populate("subtasks.assignedTo", "name email profileImage")
      .populate("comments.user", "name email profileImage")
      .populate("attachments.uploadedBy", "name email profileImage");

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
    req.body.createdBy = req.user.id;
    const task = await Task.create(req.body);

    const populatedTask = await Task.findById(task._id)
      .populate("project", "name client")
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email profileImage")
      .populate("subtasks.assignedTo", "name email profileImage")
      .populate("comments.user", "name email profileImage")
      .populate("attachments.uploadedBy", "name email profileImage");

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
    const previousSubtasks = task.subtasks ? JSON.parse(JSON.stringify(task.subtasks)) : [];

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("project", "name client")
      .populate("assignedTo", "name email profileImage")
      .populate("createdBy", "name email profileImage")
      .populate("subtasks.assignedTo", "name email profileImage")
      .populate("comments.user", "name email profileImage")
      .populate("attachments.uploadedBy", "name email profileImage");

    // Check if task status has been updated (e.g. marked completed)
    if (req.body.status && req.body.status !== previousStatus) {
      const io = req.app.get("io");
      const isAssignee = task.assignedTo?._id?.toString() === req.user.id;

      if (isAssignee) {
        // A member updated their own task status. Notify all admins and operation managers!
        const managers = await User.find({ role: { $in: ["admin", "operationmanager"] } });
        for (const manager of managers) {
          const notification = await Notification.create({
            recipient: manager._id,
            sender: req.user.id,
            type: "task_updated",
            message: `Member ${req.user.name} updated task "${task.title}" to: ${task.status}`,
            task: task._id,
            project: task.project?._id || task.project,
          });

          if (io) {
            const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
            io.to(manager._id.toString()).emit("notification", populatedNotification);
          }
        }
      } else {
        // An admin/manager updated the task status. Notify the assignee!
        const recipient = task.assignedTo?._id || task.assignedTo;
        if (recipient) {
          const notification = await Notification.create({
            recipient,
            sender: req.user.id,
            type: "task_updated",
            message: `Task "${task.title}" status updated to: ${task.status}`,
            task: task._id,
            project: task.project?._id || task.project,
          });

          if (io) {
            const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
            io.to(recipient.toString()).emit("notification", populatedNotification);
          }
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
        project: task.project?._id || task.project,
      });

      const io = req.app.get("io");
      if (io) {
        const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
        io.to(req.body.assignedTo.toString()).emit("notification", populatedNotification);
      }
    }

    // Check subtask updates
    if (req.body.subtasks) {
      const io = req.app.get("io");
      for (const sub of (task.subtasks || [])) {
        // Find previous subtask state
        const prevSub = previousSubtasks.find(p => p._id && sub._id && p._id.toString() === sub._id.toString());
        
        if (!prevSub) {
          // New subtask added! If assigned, send notification
          const subAssignee = sub.assignedTo?._id || sub.assignedTo;
          if (subAssignee) {
            const notification = await Notification.create({
              recipient: subAssignee,
              sender: req.user.id,
              type: "task_assigned",
              message: `You have been assigned a new subtask: "${sub.title || 'Untitled'}" in task "${task.title}"`,
              task: task._id,
              project: task.project?._id || task.project,
            });

            if (io) {
              const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
              io.to(subAssignee.toString()).emit("notification", populatedNotification);
            }
          }
        } else {
          // Existing subtask. Check for assignee change
          const prevSubAssignee = prevSub.assignedTo?._id || prevSub.assignedTo;
          const currSubAssignee = sub.assignedTo?._id || sub.assignedTo;

          if (currSubAssignee && currSubAssignee.toString() !== prevSubAssignee?.toString()) {
            // Assigned to someone else
            const notification = await Notification.create({
              recipient: currSubAssignee,
              sender: req.user.id,
              type: "task_assigned",
              message: `You have been assigned the subtask: "${sub.title}" in task "${task.title}"`,
              task: task._id,
              project: task.project?._id || task.project,
            });

            if (io) {
              const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
              io.to(currSubAssignee.toString()).emit("notification", populatedNotification);
            }
          }

          // Check for status change
          if (sub.status && sub.status !== prevSub.status) {
            const isSubAssignee = currSubAssignee?.toString() === req.user.id || prevSubAssignee?.toString() === req.user.id;
            if (isSubAssignee) {
              // Member updated their own subtask status. Notify all admins and operation managers!
              const managers = await User.find({ role: { $in: ["admin", "operationmanager"] } });
              for (const manager of managers) {
                const notification = await Notification.create({
                  recipient: manager._id,
                  sender: req.user.id,
                  type: "task_updated",
                  message: `Member ${req.user.name} updated subtask "${sub.title}" to: ${sub.status} (in task "${task.title}")`,
                  task: task._id,
                  project: task.project?._id || task.project,
                });

                if (io) {
                  const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
                  io.to(manager._id.toString()).emit("notification", populatedNotification);
                }
              }
            } else {
              // Admin/manager updated the subtask status. Notify assignee!
              if (currSubAssignee) {
                const notification = await Notification.create({
                  recipient: currSubAssignee,
                  sender: req.user.id,
                  type: "task_updated",
                  message: `Subtask "${sub.title}" status updated to: ${sub.status} (in task "${task.title}")`,
                  task: task._id,
                  project: task.project?._id || task.project,
                });

                if (io) {
                  const populatedNotification = await Notification.findById(notification._id).populate("sender", "name");
                  io.to(currSubAssignee.toString()).emit("notification", populatedNotification);
                }
              }
            }
          }
        }
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
