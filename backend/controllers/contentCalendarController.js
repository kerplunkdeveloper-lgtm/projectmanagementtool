const ContentCalendar = require("../models/ContentCalendar");

// @desc    Get all content calendar tasks (Dynamic from DB with user & role filtering)
// @route   GET /api/content-calendar
// @access  Private
exports.getContentTasks = async (req, res) => {
  try {
    const userRole = (req.user?.role || "").toLowerCase();
    const isManagerOrAdmin =
      userRole === "admin" || userRole === "operationmanager";

    let query = {};
    if (!isManagerOrAdmin && req.user?._id) {
      query = {
        $or: [
          { createdBy: req.user._id },
          { assignedTo: req.user._id },
          { "subtasks.assigneeUser": req.user._id },
        ],
      };
    }

    const tasks = await ContentCalendar.find(query)
      .populate("client", "companyName color icon service industry")
      .populate("assignedTo", "name email role profile profileImage avatar")
      .populate("createdBy", "name email role profile profileImage avatar")
      .populate("subtasks.assigneeUser", "name email role profile profileImage avatar")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("Error in getContentTasks:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching content tasks",
      error: error.message,
    });
  }
};

// @desc    Create a content calendar task
// @route   POST /api/content-calendar
// @access  Private
exports.createContentTask = async (req, res) => {
  try {
    const body = { ...req.body };
    if (Array.isArray(body.platforms) && body.platforms.length > 0) {
      body.platform = body.platforms[0];
    } else if (body.platform) {
      body.platforms = [body.platform];
    }

    let assignedTo = body.assignedTo;
    if (!assignedTo && body.assignedUserId) {
      assignedTo = [body.assignedUserId];
    }

    const taskData = {
      ...body,
      assignedTo:
        Array.isArray(assignedTo) && assignedTo.length > 0
          ? assignedTo
          : req.user
            ? [req.user._id]
            : [],
      createdBy: req.user ? req.user._id : null,
    };

    let task = await ContentCalendar.create(taskData);
    task = await ContentCalendar.findById(task._id)
      .populate("client", "companyName color icon service industry")
      .populate("assignedTo", "name email role profile profileImage avatar")
      .populate("createdBy", "name email role profile profileImage avatar")
      .populate("subtasks.assigneeUser", "name email role profile profileImage avatar");

    res.status(201).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error in createContentTask:", error);
    res.status(400).json({
      success: false,
      message: "Failed to create content task",
      error: error.message,
    });
  }
};

// @desc    Update a content calendar task
// @route   PUT /api/content-calendar/:id
// @access  Private
exports.updateContentTask = async (req, res) => {
  try {
    let task = await ContentCalendar.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Content task not found",
      });
    }

    const body = { ...req.body };
    if (Array.isArray(body.platforms) && body.platforms.length > 0) {
      body.platform = body.platforms[0];
    } else if (body.platform && !body.platforms) {
      body.platforms = [body.platform];
    }

    if (body.assignedUserId) {
      body.assignedTo = [body.assignedUserId];
    }

    task = await ContentCalendar.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    })
      .populate("client", "companyName color icon service industry")
      .populate("assignedTo", "name email role profile profileImage avatar")
      .populate("createdBy", "name email role profile profileImage avatar")
      .populate("subtasks.assigneeUser", "name email role profile profileImage avatar");

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("Error in updateContentTask:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update content task",
      error: error.message,
    });
  }
};

// @desc    Delete a content calendar task
// @route   DELETE /api/content-calendar/:id
// @access  Private
exports.deleteContentTask = async (req, res) => {
  try {
    const task = await ContentCalendar.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Content task not found",
      });
    }

    const userRole = (req.user?.role || "").toLowerCase();
    const isManagerOrAdmin =
      userRole === "admin" || userRole === "operationmanager";
    const isCreator =
      task.createdBy &&
      req.user &&
      task.createdBy.toString() === req.user._id.toString();

    if (!isManagerOrAdmin && !isCreator) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this task",
      });
    }

    await ContentCalendar.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      data: {},
      message: "Content task removed successfully",
    });
  } catch (error) {
    console.error("Error in deleteContentTask:", error);
    res.status(400).json({
      success: false,
      message: "Failed to delete content task",
      error: error.message,
    });
  }
};

// @desc    Bulk update tasks status or deletion
// @route   POST /api/content-calendar/bulk
// @access  Private
exports.bulkAction = async (req, res) => {
  try {
    const { action, taskIds, status } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No task IDs provided",
      });
    }

    if (action === "delete") {
      await ContentCalendar.deleteMany({ _id: { $in: taskIds } });
      return res.status(200).json({
        success: true,
        message: `${taskIds.length} tasks deleted successfully`,
      });
    } else if (action === "updateStatus" && status) {
      await ContentCalendar.updateMany(
        { _id: { $in: taskIds } },
        { $set: { status } }
      );
      return res.status(200).json({
        success: true,
        message: `${taskIds.length} tasks updated to ${status}`,
      });
    }

    res.status(400).json({
      success: false,
      message: "Invalid action specified",
    });
  } catch (error) {
    console.error("Error in bulkAction:", error);
    res.status(500).json({
      success: false,
      message: "Bulk action failed",
      error: error.message,
    });
  }
};
