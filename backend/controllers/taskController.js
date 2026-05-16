const Task = require("../models/Task");
const Project = require("../models/Project");

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === "admin" || req.user.role === "operationmanager") {
      tasks = await Task.find()
        .populate("project", "title")
        .populate("assignedTo", "name email")
        .populate("createdBy", "name")
        .sort("-createdAt");
    } else {
      // Team members only see tasks assigned to them
      tasks = await Task.find({ assignedTo: req.user.id })
        .populate("project", "title")
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

    // Check if project exists
    const project = await Project.findById(req.body.project);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const task = await Task.create(req.body);
    
    // Optional: Add user to project's assignedTo if not already there
    if (!project.assignedTo.includes(req.body.assignedTo)) {
      project.assignedTo.push(req.body.assignedTo);
      await project.save();
    }

    res.status(201).json({
      success: true,
      data: task,
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

    // Role check: Only admin/manager can update assignment, others can update status
    if (req.user.role === "team" && req.body.assignedTo && req.body.assignedTo !== req.user.id) {
       return res.status(401).json({ success: false, message: "Not authorized to reassign tasks" });
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("project", "title").populate("assignedTo", "name email");

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
