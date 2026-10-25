const HrTask = require("../models/HrTask");
const User = require("../models/User");
const Notification = require("../models/Notification");
const cloudinary = require("../config/cloudinary");

// Helper to check if user is manager or admin
const isManagerOrAdmin = (user) => {
  if (!user) return false;
  const role = (user.role || "").toLowerCase();
  const dept = (user.department || "").toLowerCase();
  return (
    role === "admin" ||
    role === "operationmanager" ||
    role === "operation manager" ||
    dept.includes("operation manager") ||
    dept.includes("managing partner")
  );
};

// Reusable populate config to always populate users and their Profile pictures
const hrTaskPopulateConfig = [
  {
    path: "assignedTo",
    select: "name email role department profileImage profile",
    populate: { path: "profile", select: "profileImage" },
  },
  {
    path: "createdBy",
    select: "name email role department profileImage profile",
    populate: { path: "profile", select: "profileImage" },
  },
  { path: "checklist.completedBy", select: "name email" },
  {
    path: "comments.user",
    select: "name email role profileImage profile",
    populate: { path: "profile", select: "profileImage" },
  },
  {
    path: "activityHistory.performedBy",
    select: "name email role profileImage profile",
    populate: { path: "profile", select: "profileImage" },
  },
  {
    path: "review.reviewedBy",
    select: "name email role profileImage profile",
    populate: { path: "profile", select: "profileImage" },
  },
  {
    path: "submission.submittedBy",
    select: "name email role profileImage profile",
    populate: { path: "profile", select: "profileImage" },
  },
];

// Helper to send real-time notification
const sendNotification = async (io, { recipientId, senderId, type, message, hrTaskId }) => {
  try {
    if (!recipientId || recipientId.toString() === senderId.toString()) return null;

    const notification = await Notification.create({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      hrTask: hrTaskId,
    });

    if (io) {
      const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "name email role department profileImage profile")
        .populate("hrTask", "title category status priority dueDate");
      io.to(recipientId.toString()).emit("notification", populatedNotification);
      io.to(recipientId.toString()).emit("new_notification", populatedNotification);
    }
    return notification;
  } catch (err) {
    console.error("[HrTaskController] Notification error:", err.message);
    return null;
  }
};

// @desc    Get all HR tasks with flexible filtering & search
// @route   GET /api/hr-tasks
// @access  Private
exports.getHrTasks = async (req, res) => {
  try {
    const {
      search,
      status,
      priority,
      category,
      assignedTo,
      dueDateFilter,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = {};
    const isManager = isManagerOrAdmin(req.user);

    // Role-based visibility
    if (!isManager) {
      // HR user: see only tasks assigned to them by default
      query.assignedTo = req.user._id;
    } else if (assignedTo && assignedTo !== "all") {
      query.assignedTo = assignedTo;
    }

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== "all") {
      query.priority = priority;
    }

    // Category filter
    if (category && category !== "all") {
      query.category = category;
    }

    // Search filter (title, description, category)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    // Due date filter
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    if (dueDateFilter === "overdue") {
      // Overdue: past due date and active, excluding Submitted tasks awaiting review
      query.dueDate = { $lt: now };
      query.status = { $in: ["Pending", "In Progress", "Changes Requested"] };
    } else if (dueDateFilter === "due_soon") {
      // Due soon: within next 3 days and active
      query.dueDate = { $gte: now, $lte: threeDaysLater };
      query.status = { $nin: ["Completed", "Cancelled"] };
    } else if (dueDateFilter === "today") {
      query.dueDate = { $gte: startOfToday, $lte: endOfToday };
    } else if (dueDateFilter === "this_week") {
      query.dueDate = { $gte: startOfToday, $lte: sevenDaysLater };
    } else if (dueDateFilter === "completed") {
      query.status = "Completed";
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === "asc" ? 1 : -1;

    const tasks = await HrTask.find(query)
      .populate(hrTaskPopulateConfig)
      .sort(sortObj);

    res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (error) {
    console.error("[getHrTasks Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error fetching HR tasks",
    });
  }
};

// @desc    Get dashboard counts & workload metrics for Manager & HR
// @route   GET /api/hr-tasks/metrics
// @access  Private
exports.getHrTaskMetrics = async (req, res) => {
  try {
    const now = new Date();
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const userId = req.user._id;

    // 1. Manager All-tasks Metrics
    const allTasks = await HrTask.find({}).select("status dueDate assignedTo");

    const managerCounts = {
      totalActive: 0,
      inProgress: 0,
      submittedForReview: 0,
      overdue: 0,
      completed: 0,
      changesRequested: 0,
      pending: 0,
      cancelled: 0,
    };

    allTasks.forEach((task) => {
      const isPastDue = new Date(task.dueDate) < now;
      const isDueSoon =
        new Date(task.dueDate) >= now && new Date(task.dueDate) <= threeDaysLater;

      if (["Pending", "In Progress", "Changes Requested"].includes(task.status)) {
        managerCounts.totalActive++;
      }

      if (task.status === "Pending") managerCounts.pending++;
      if (task.status === "In Progress") managerCounts.inProgress++;
      if (task.status === "Submitted") managerCounts.submittedForReview++;
      if (task.status === "Completed") managerCounts.completed++;
      if (task.status === "Changes Requested") managerCounts.changesRequested++;
      if (task.status === "Cancelled") managerCounts.cancelled++;

      // Overdue: active excluding Submitted tasks awaiting review
      if (
        isPastDue &&
        ["Pending", "In Progress", "Changes Requested"].includes(task.status)
      ) {
        managerCounts.overdue++;
      }
    });

    // 2. HR Metrics (for current logged-in user)
    const hrUserTasks = allTasks.filter(
      (t) => t.assignedTo && t.assignedTo.toString() === userId.toString()
    );

    const hrCounts = {
      myActiveTasks: 0,
      dueSoon: 0,
      changesRequested: 0,
      submittedForReview: 0,
      completed: 0,
      overdue: 0,
    };

    hrUserTasks.forEach((task) => {
      const isPastDue = new Date(task.dueDate) < now;
      const isDueSoon =
        new Date(task.dueDate) >= now && new Date(task.dueDate) <= threeDaysLater;

      if (["Pending", "In Progress", "Changes Requested"].includes(task.status)) {
        hrCounts.myActiveTasks++;
      }

      if (task.status === "Submitted") hrCounts.submittedForReview++;
      if (task.status === "Changes Requested") hrCounts.changesRequested++;
      if (task.status === "Completed") hrCounts.completed++;

      if (
        isDueSoon &&
        ["Pending", "In Progress", "Changes Requested"].includes(task.status)
      ) {
        hrCounts.dueSoon++;
      }

      // HR overdue rule: submitted tasks awaiting review are NOT overdue for HR
      if (
        isPastDue &&
        ["Pending", "In Progress", "Changes Requested"].includes(task.status)
      ) {
        hrCounts.overdue++;
      }
    });

    // 3. HR Team Members Workload Breakdown (for Manager)
    const hrUsers = await User.find({
      $or: [
        { role: "humanresource" },
        { department: { $regex: /human resource|hr/i } },
      ],
      employmentStatus: { $ne: "relieved" },
      accountStatus: { $ne: "inactive" },
    })
      .select("name email role department profileImage profile")
      .populate("profile", "profileImage");

    const workload = hrUsers.map((user) => {
      const userTasks = allTasks.filter(
        (t) => t.assignedTo && t.assignedTo.toString() === user._id.toString()
      );

      let active = 0;
      let inProgress = 0;
      let submitted = 0;
      let overdue = 0;
      let completed = 0;
      let changesRequested = 0;

      userTasks.forEach((t) => {
        const isPastDue = new Date(t.dueDate) < now;
        if (["Pending", "In Progress", "Changes Requested"].includes(t.status)) {
          active++;
        }
        if (t.status === "In Progress") inProgress++;
        if (t.status === "Submitted") submitted++;
        if (t.status === "Completed") completed++;
        if (t.status === "Changes Requested") changesRequested++;
        if (isPastDue && ["Pending", "In Progress", "Changes Requested"].includes(t.status)) {
          overdue++;
        }
      });

      return {
        user,
        totalTasks: userTasks.length,
        activeTasks: active,
        inProgress,
        submitted,
        overdue,
        completed,
        changesRequested,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        managerCounts,
        hrCounts,
        workload,
      },
    });
  } catch (error) {
    console.error("[getHrTaskMetrics Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error fetching metrics",
    });
  }
};

// @desc    Get HR team members for assignment
// @route   GET /api/hr-tasks/hr-users
// @access  Private
exports.getHrUsers = async (req, res) => {
  try {
    // Find all users who are HR or have HR in department
    let users = await User.find({
      $or: [
        { role: "humanresource" },
        { department: { $regex: /human resource|hr/i } },
      ],
      employmentStatus: { $ne: "relieved" },
      accountStatus: { $ne: "inactive" },
    })
      .select("name email role department profileImage profile")
      .populate("profile", "profileImage");

    // If no specific HR users found, also list all active team members
    if (users.length === 0) {
      users = await User.find({
        employmentStatus: { $ne: "relieved" },
        accountStatus: { $ne: "inactive" },
      })
        .select("name email role department profileImage profile")
        .populate("profile", "profileImage");
    }

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("[getHrUsers Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error fetching HR users",
    });
  }
};

// @desc    Get single HR task details
// @route   GET /api/hr-tasks/:id
// @access  Private
exports.getHrTaskById = async (req, res) => {
  try {
    const task = await HrTask.findById(req.params.id)
      .populate(hrTaskPopulateConfig);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    console.error("[getHrTaskById Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error fetching task details",
    });
  }
};

// @desc    Create new HR task (Manager/Admin)
// @route   POST /api/hr-tasks
// @access  Private (Manager/Admin)
exports.createHrTask = async (req, res) => {
  try {
    const {
      title,
      description,
      category = "General HR",
      priority = "Medium",
      dueDate,
      assignedTo,
      checklist = [],
      attachments = [],
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a task title",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "Please provide a due date",
      });
    }

    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Please assign this task to an HR team member",
      });
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: "Assigned user not found",
      });
    }

    // Format checklist items
    const formattedChecklist = checklist
      .filter((item) => item && (typeof item === "string" ? item.trim() : item.item?.trim()))
      .map((item) => ({
        item: typeof item === "string" ? item.trim() : item.item.trim(),
        completed: typeof item === "object" ? !!item.completed : false,
      }));

    const newTask = new HrTask({
      title: title.trim(),
      description: (description || "").trim(),
      category: category.trim(),
      priority,
      status: "Pending",
      dueDate: new Date(dueDate),
      assignedTo,
      createdBy: req.user._id,
      checklist: formattedChecklist,
      attachments: attachments || [],
      activityHistory: [
        {
          action: "Task Created",
          details: `Task created and assigned to ${assignedUser.name}`,
          performedBy: req.user._id,
          timestamp: new Date(),
        },
      ],
      lastUpdated: new Date(),
    });

    await newTask.save();

    // Populate for response & real-time notification
    const populatedTask = await HrTask.findById(newTask._id)
      .populate(hrTaskPopulateConfig);

    // Real-time Notification to HR Assignee
    const io = req.app.get("io");
    await sendNotification(io, {
      recipientId: assignedTo,
      senderId: req.user._id,
      type: "hr_task_assigned",
      message: `New HR task assigned: "${newTask.title}" (Due: ${new Date(dueDate).toLocaleDateString()})`,
      hrTaskId: newTask._id,
    });

    res.status(201).json({
      success: true,
      message: "HR task created successfully",
      data: populatedTask,
    });
  } catch (error) {
    console.error("[createHrTask Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error creating task",
    });
  }
};

// @desc    Edit, reassign, or update task details (Manager/Admin)
// @route   PUT /api/hr-tasks/:id
// @access  Private (Manager/Admin)
exports.updateHrTask = async (req, res) => {
  try {
    const task = await HrTask.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    const {
      title,
      description,
      category,
      priority,
      dueDate,
      assignedTo,
      checklist,
      attachments,
    } = req.body;

    const changes = [];

    // Track Title change
    if (title && title.trim() !== task.title) {
      changes.push(`Title updated from "${task.title}" to "${title.trim()}"`);
      task.title = title.trim();
    }

    // Track Description change
    if (description !== undefined && description !== task.description) {
      task.description = (description || "").trim();
      changes.push("Description updated");
    }

    // Track Category change
    if (category && category !== task.category) {
      changes.push(`Category changed from ${task.category} to ${category}`);
      task.category = category;
    }

    // Track Priority change
    if (priority && priority !== task.priority) {
      changes.push(`Priority changed from ${task.priority} to ${priority}`);
      task.priority = priority;
    }

    // Track Due Date change (explicit requirement: show in activity history!)
    if (dueDate && new Date(dueDate).getTime() !== new Date(task.dueDate).getTime()) {
      const oldDue = new Date(task.dueDate).toLocaleDateString();
      const newDue = new Date(dueDate).toLocaleDateString();
      changes.push(`Due date changed from ${oldDue} to ${newDue}`);
      task.dueDate = new Date(dueDate);
      task.dueSoonNotified = false; // Reset notification trigger if date changed
    }

    // Track Reassignment change (explicit requirement: record in activity history!)
    let oldAssigneeId = task.assignedTo?.toString();
    if (assignedTo && assignedTo.toString() !== oldAssigneeId) {
      const newAssignee = await User.findById(assignedTo);
      const oldAssignee = await User.findById(oldAssigneeId);
      const oldName = oldAssignee ? oldAssignee.name : "Previous Assignee";
      const newName = newAssignee ? newAssignee.name : "New Assignee";

      changes.push(`Reassigned from ${oldName} to ${newName}`);
      task.assignedTo = assignedTo;

      // Notify new assignee
      const io = req.app.get("io");
      await sendNotification(io, {
        recipientId: assignedTo,
        senderId: req.user._id,
        type: "hr_task_assigned",
        message: `HR task reassigned to you: "${task.title}"`,
        hrTaskId: task._id,
      });
    }

    // Update Checklist if provided
    if (Array.isArray(checklist)) {
      task.checklist = checklist.map((c) => ({
        _id: c._id || undefined,
        item: c.item,
        completed: !!c.completed,
        completedAt: c.completed ? c.completedAt || new Date() : null,
        completedBy: c.completed ? c.completedBy || req.user._id : null,
      }));
      changes.push("Checklist updated");
    }

    // Update attachments if provided
    if (Array.isArray(attachments)) {
      task.attachments = attachments;
    }

    // If changes occurred, append to Activity History
    if (changes.length > 0) {
      task.activityHistory.push({
        action: "Task Updated",
        details: changes.join(" | "),
        performedBy: req.user._id,
        timestamp: new Date(),
      });
      task.lastUpdated = new Date();
    }

    await task.save();

    const populatedTask = await HrTask.findById(task._id)
      .populate(hrTaskPopulateConfig);

    // Send update notification to current assignee
    const io = req.app.get("io");
    if (task.assignedTo?.toString() !== req.user._id.toString()) {
      await sendNotification(io, {
        recipientId: task.assignedTo,
        senderId: req.user._id,
        type: "hr_task_updated",
        message: `Task "${task.title}" was updated by Manager`,
        hrTaskId: task._id,
      });
    }

    res.status(200).json({
      success: true,
      message: "HR task updated successfully",
      data: populatedTask,
    });
  } catch (error) {
    console.error("[updateHrTask Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error updating task",
    });
  }
};

// @desc    Update task status (Start task: Pending -> In Progress, etc.)
// @route   PATCH /api/hr-tasks/:id/status
// @access  Private
exports.updateHrTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await HrTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    const validStatuses = [
      "Pending",
      "In Progress",
      "Submitted",
      "Completed",
      "Changes Requested",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status: ${status}`,
      });
    }

    const oldStatus = task.status;
    task.status = status;
    task.lastUpdated = new Date();

    task.activityHistory.push({
      action: status === "In Progress" ? "Task Started" : "Status Changed",
      details: `Status changed from ${oldStatus} to ${status}`,
      performedBy: req.user._id,
      timestamp: new Date(),
    });

    await task.save();

    const populatedTask = await HrTask.findById(task._id)
      .populate(hrTaskPopulateConfig);

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      data: populatedTask,
    });
  } catch (error) {
    console.error("[updateHrTaskStatus Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error updating status",
    });
  }
};

// @desc    Toggle checklist item (HR user or Manager)
// @route   PATCH /api/hr-tasks/:id/checklist/:itemId
// @access  Private
exports.toggleChecklistItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const task = await HrTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    const item = task.checklist.id(itemId);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Checklist item not found",
      });
    }

    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : null;
    item.completedBy = item.completed ? req.user._id : null;
    task.lastUpdated = new Date();

    // If starting any checklist item and status was Pending, auto-transition to In Progress
    if (item.completed && task.status === "Pending") {
      task.status = "In Progress";
      task.activityHistory.push({
        action: "Task Started",
        details: "Task automatically started on checklist progress",
        performedBy: req.user._id,
        timestamp: new Date(),
      });
    }

    task.activityHistory.push({
      action: "Checklist Item Updated",
      details: `"${item.item}" marked as ${item.completed ? "Completed" : "Incomplete"}`,
      performedBy: req.user._id,
      timestamp: new Date(),
    });

    await task.save();

    const populatedTask = await HrTask.findById(task._id)
      .populate(hrTaskPopulateConfig);

    res.status(200).json({
      success: true,
      data: populatedTask,
    });
  } catch (error) {
    console.error("[toggleChecklistItem Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error toggling checklist item",
    });
  }
};

// @desc    Flag or resolve a blocker (HR user requirement)
// @route   POST /api/hr-tasks/:id/blocker
// @access  Private
exports.flagBlocker = async (req, res) => {
  try {
    const { id } = req.params;
    const { hasBlocker, description } = req.body;
    const task = await HrTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    if (hasBlocker) {
      task.blocker = {
        hasBlocker: true,
        description: (description || "").trim(),
        flaggedAt: new Date(),
        flaggedBy: req.user._id,
        resolved: false,
        resolvedAt: null,
      };

      task.activityHistory.push({
        action: "Blocker Flagged",
        details: `Blocker reported: "${(description || "Issue encountered").trim()}"`,
        performedBy: req.user._id,
        timestamp: new Date(),
      });

      // Notify Manager
      const io = req.app.get("io");
      await sendNotification(io, {
        recipientId: task.createdBy,
        senderId: req.user._id,
        type: "hr_task_blocker",
        message: `HR Blocker Flagged on "${task.title}": ${(description || "").slice(0, 80)}`,
        hrTaskId: task._id,
      });
    } else {
      task.blocker.hasBlocker = false;
      task.blocker.resolved = true;
      task.blocker.resolvedAt = new Date();

      task.activityHistory.push({
        action: "Blocker Resolved",
        details: "Blocker marked as resolved",
        performedBy: req.user._id,
        timestamp: new Date(),
      });
    }

    task.lastUpdated = new Date();
    await task.save();

    const populatedTask = await HrTask.findById(task._id)
      .populate(hrTaskPopulateConfig);

    res.status(200).json({
      success: true,
      message: hasBlocker ? "Blocker flagged successfully" : "Blocker resolved",
      data: populatedTask,
    });
  } catch (error) {
    console.error("[flagBlocker Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error setting blocker",
    });
  }
};

// @desc    Submit completed work for manager review (HR user requirement)
// @route   POST /api/hr-tasks/:id/submit
// @access  Private (HR Assignee or Admin)
exports.submitHrTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes = "", attachments = [] } = req.body;
    const task = await HrTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    task.status = "Submitted";
    task.submission = {
      notes: notes.trim(),
      submittedAt: new Date(),
      submittedBy: req.user._id,
      attachments: attachments || [],
    };

    task.activityHistory.push({
      action: "Work Submitted for Review",
      details: notes ? `Submission notes: "${notes.trim()}"` : "Work submitted for manager review",
      performedBy: req.user._id,
      timestamp: new Date(),
    });

    task.lastUpdated = new Date();
    await task.save();

    // Notify Manager
    const io = req.app.get("io");
    await sendNotification(io, {
      recipientId: task.createdBy,
      senderId: req.user._id,
      type: "hr_task_submitted",
      message: `HR task submitted for review: "${task.title}" by ${req.user.name}`,
      hrTaskId: task._id,
    });

    const populatedTask = await HrTask.findById(task._id)
      .populate(hrTaskPopulateConfig);

    res.status(200).json({
      success: true,
      message: "Work submitted for review successfully",
      data: populatedTask,
    });
  } catch (error) {
    console.error("[submitHrTask Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error submitting task",
    });
  }
};

// @desc    Review submitted task: Approve or Request Changes (Manager requirement)
// @route   POST /api/hr-tasks/:id/review
// @access  Private (Manager/Admin)
exports.reviewHrTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, feedback = "" } = req.body; // 'Approved' | 'Changes Requested'
    const task = await HrTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    if (!["Approved", "Changes Requested"].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: "Decision must be either 'Approved' or 'Changes Requested'",
      });
    }

    if (decision === "Changes Requested" && !feedback.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide review feedback when requesting changes",
      });
    }

    const io = req.app.get("io");

    if (decision === "Approved") {
      task.status = "Completed";
      task.review = {
        decision: "Approved",
        feedback: feedback.trim(),
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      };

      task.activityHistory.push({
        action: "Submission Approved",
        details: feedback
          ? `Approved with note: "${feedback.trim()}"`
          : "Work approved and marked Completed",
        performedBy: req.user._id,
        timestamp: new Date(),
      });

      // Notify HR Assignee
      await sendNotification(io, {
        recipientId: task.assignedTo,
        senderId: req.user._id,
        type: "hr_task_reviewed",
        message: `Great job! Your submission for "${task.title}" was approved by ${req.user.name}`,
        hrTaskId: task._id,
      });
    } else {
      task.status = "Changes Requested";
      task.review = {
        decision: "Changes Requested",
        feedback: feedback.trim(),
        reviewedBy: req.user._id,
        reviewedAt: new Date(),
      };

      task.activityHistory.push({
        action: "Changes Requested",
        details: `Manager requested changes: "${feedback.trim()}"`,
        performedBy: req.user._id,
        timestamp: new Date(),
      });

      // Also append feedback as a system feedback comment so HR can easily view in discussion
      task.comments.push({
        user: req.user._id,
        text: `Review Feedback: ${feedback.trim()}`,
        isFeedback: true,
        createdAt: new Date(),
      });

      // Notify HR Assignee
      await sendNotification(io, {
        recipientId: task.assignedTo,
        senderId: req.user._id,
        type: "hr_task_reviewed",
        message: `Changes requested on "${task.title}": ${feedback.slice(0, 80)}`,
        hrTaskId: task._id,
      });
    }

    task.lastUpdated = new Date();
    await task.save();

    const populatedTask = await HrTask.findById(task._id)
      .populate(hrTaskPopulateConfig);

    res.status(200).json({
      success: true,
      message:
        decision === "Approved"
          ? "Task approved and completed!"
          : "Changes requested from HR assignee",
      data: populatedTask,
    });
  } catch (error) {
    console.error("[reviewHrTask Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error reviewing task",
    });
  }
};

// @desc    Add comment or progress note
// @route   POST /api/hr-tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text, isFeedback = false } = req.body;
    const task = await HrTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text cannot be empty",
      });
    }

    const newComment = {
      user: req.user._id,
      text: text.trim(),
      isFeedback: !!isFeedback,
      createdAt: new Date(),
    };

    task.comments.push(newComment);
    task.lastUpdated = new Date();

    task.activityHistory.push({
      action: isFeedback ? "Feedback Note Added" : "Comment Added",
      details: text.trim().slice(0, 100),
      performedBy: req.user._id,
      timestamp: new Date(),
    });

    await task.save();

    // Determine notification recipient (opposite party)
    const isAssignee = task.assignedTo?.toString() === req.user._id.toString();
    const recipientId = isAssignee ? task.createdBy : task.assignedTo;

    const io = req.app.get("io");
    await sendNotification(io, {
      recipientId,
      senderId: req.user._id,
      type: "hr_task_comment",
      message: `New note on "${task.title}": ${text.trim().slice(0, 70)}`,
      hrTaskId: task._id,
    });

    const populatedTask = await HrTask.findById(task._id)
      .populate(hrTaskPopulateConfig);

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: populatedTask,
    });
  } catch (error) {
    console.error("[addComment Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error adding comment",
    });
  }
};

// @desc    Cancel HR Task (Manager/Admin requirement: excluded from active task counts)
// @route   POST /api/hr-tasks/:id/cancel
// @access  Private (Manager/Admin)
exports.cancelHrTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await HrTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    task.status = "Cancelled";
    task.lastUpdated = new Date();

    task.activityHistory.push({
      action: "Task Cancelled",
      details: `Task cancelled by ${req.user.name}`,
      performedBy: req.user._id,
      timestamp: new Date(),
    });

    await task.save();

    // Notify HR Assignee
    const io = req.app.get("io");
    await sendNotification(io, {
      recipientId: task.assignedTo,
      senderId: req.user._id,
      type: "hr_task_cancelled",
      message: `HR task "${task.title}" has been cancelled by manager`,
      hrTaskId: task._id,
    });

    const populatedTask = await HrTask.findById(task._id)
      .populate(hrTaskPopulateConfig);

    res.status(200).json({
      success: true,
      message: "Task has been cancelled",
      data: populatedTask,
    });
  } catch (error) {
    console.error("[cancelHrTask Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error cancelling task",
    });
  }
};

// @desc    Delete HR Task (Manager/Admin)
// @route   DELETE /api/hr-tasks/:id
// @access  Private (Manager/Admin)
exports.deleteHrTask = async (req, res) => {
  try {
    const isManager = isManagerOrAdmin(req.user);
    if (!isManager) {
      return res.status(403).json({
        success: false,
        message: "Only Managers or Admins can delete HR tasks",
      });
    }

    const { id } = req.params;
    const task = await HrTask.findById(id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "HR Task not found",
      });
    }

    await HrTask.findByIdAndDelete(id);

    // Clean up related notifications
    await Notification.deleteMany({ hrTask: id });

    res.status(200).json({
      success: true,
      message: "HR Task deleted successfully",
    });
  } catch (error) {
    console.error("[deleteHrTask Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error deleting task",
    });
  }
};

// @desc    Upload attachment for HR task
// @route   POST /api/hr-tasks/upload
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    let fileUrl = "";
    try {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "hr_tasks",
        resource_type: "auto",
      });
      fileUrl = result.secure_url;
    } catch (uploadErr) {
      // Fallback if Cloudinary is not configured or rejects
      fileUrl = `/uploads/${req.file.filename}`;
    }

    res.status(200).json({
      success: true,
      data: {
        name: req.file.originalname,
        url: fileUrl,
        fileType: req.file.mimetype,
        size: req.file.size,
      },
    });
  } catch (error) {
    console.error("[uploadAttachment Error]:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server Error uploading attachment",
    });
  }
};
