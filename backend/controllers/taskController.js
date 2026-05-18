const Task = require("../models/Task");
const Project = require("../models/Project");
const Notification = require("../models/Notification");



exports.getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === "admin" || req.user.role === "operationmanager") {
      tasks = await Task.find()
        .populate({
          path: "project",
          select: "title client",
          populate: { path: "client", select: "companyName" }
        })
        .populate("client", "companyName")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name")
        .sort("-createdAt");
    } else {
      // Team members only see tasks assigned to them
      tasks = await Task.find({ assignedTo: req.user.id })
        .populate({
          path: "project",
          select: "title client",
          populate: { path: "client", select: "companyName" }
        })
        .populate("client", "companyName")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name")
        .sort("-createdAt");
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Admin & Operation Manager)
exports.createTask = async (req, res) => {
  try {
    req.body.createdBy = req.user.id;

    // Check if project exists (if provided)
    let project = null;
    if (req.body.project) {
      project = await Project.findById(req.body.project);
      if (!project) {
        return res.status(404).json({ success: false, message: "Project not found" });
      }
    }

    if (project && project.client) {
      req.body.client = project.client;
    }

    const task = await Task.create(req.body);

    // Optional: Add user to project's assignedTo if not already there
    if (project && req.body.assignedTo && !project.assignedTo.includes(req.body.assignedTo)) {
      project.assignedTo.push(req.body.assignedTo);
      await project.save();
    }

    // CREATE NOTIFICATION
    const notification = await Notification.create({
      recipient: req.body.assignedTo,
      sender: req.user.id,
      type: 'task_assigned',
      message: `A new task "${task.title}" has been assigned to you${project ? ` in project "${project.title}"` : ''}.`,
      task: task._id
    });

    // EMIT REAL-TIME NOTIFICATION
    const io = req.app.get('io');
    if (io) {
      io.to(req.body.assignedTo.toString()).emit('notification', notification);
    }

    // POPULATE NEW TASK
    const populatedTask = await Task.findById(task._id)
      .populate({
        path: "project",
        select: "title client",
        populate: { path: "client", select: "companyName" }
      })
      .populate("client", "companyName")
      .populate("assignedTo", "name email")
      .populate("createdBy", "name");

    res.status(201).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    const oldAssignedTo = task.assignedTo?.toString();

    // Role check: Only admin/manager can update assignment, others can update status
    if (req.user.role === "team" && req.body.assignedTo && req.body.assignedTo !== req.user.id) {
       return res.status(401).json({ success: false, message: "Not authorized to reassign tasks" });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate({
        path: "project",
        select: "title client",
        populate: { path: "client", select: "companyName" }
      })
      .populate("client", "companyName")
      .populate("assignedTo", "name email");

    // NOTIFY IF REASSIGNED
    if (req.body.assignedTo && req.body.assignedTo.toString() !== oldAssignedTo) {
      const notification = await Notification.create({
        recipient: req.body.assignedTo,
        sender: req.user.id,
        type: 'task_assigned',
        message: `Strategic Shift: Task "${task.title}" has been reassigned to you.`,
        task: task._id
      });

      const io = req.app.get('io');
      if (io) {
        io.to(req.body.assignedTo.toString()).emit('notification', notification);
      }
    } else if (req.body.status && req.body.status !== task.status) {
       // Optional: Notify manager when status changes
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin & Operation Manager)
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    if (req.user.role === "team") {
      return res.status(401).json({ success: false, message: "Not authorized to delete tasks" });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
