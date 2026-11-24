const HrTask = require("../models/HrTask");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { uploadMedia } = require("../config/s3");

// ------------------------------------------------------------------
// Status model
//   Not Started -> In Progress -> Completed
//   Any open status <-> On Hold (reason required)
//   Completed -> In Progress (reopen, managers only)
// ------------------------------------------------------------------
const STATUSES = ["Not Started", "In Progress", "On Hold", "Completed"];
const OPEN_STATUSES = ["Not Started", "In Progress", "On Hold"];

// Old statuses from the previous submit/review workflow
const LEGACY_STATUS_MAP = {
  Pending: "Not Started",
  Submitted: "In Progress",
  "Changes Requested": "In Progress",
  Cancelled: "On Hold",
};

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (d = new Date()) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

// A task is overdue once its due *day* has fully passed and it isn't completed
const isTaskOverdue = (task, now = new Date()) =>
  task.status !== "Completed" && new Date(task.dueDate) < startOfDay(now);

const isTaskDueSoon = (task, now = new Date()) => {
  if (task.status === "Completed") return false;
  const due = new Date(task.dueDate);
  const today = startOfDay(now);
  return due >= today && due < new Date(today.getTime() + 4 * DAY_MS);
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

const idOf = (ref) => (ref && ref._id ? ref._id.toString() : ref ? ref.toString() : "");

const isAssignee = (task, user) => idOf(task.assignedTo) === user._id.toString();

// Managers can access everything; HR users only tasks assigned to them
const canAccessTask = (task, user) => isManagerOrAdmin(user) || isAssignee(task, user);

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
  { path: "completedBy", select: "name email" },
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
];

const loadPopulated = (id) => HrTask.findById(id).populate(hrTaskPopulateConfig);

const logActivity = (task, user, action, details = "") => {
  task.activityHistory.push({
    action,
    details,
    performedBy: user._id,
    timestamp: new Date(),
  });
  task.lastUpdated = new Date();
};

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

// Notify "the other side" of the task (assignee <-> creator)
const notifyCounterpart = (req, task, type, message) => {
  const io = req.app.get("io");
  const recipientId = isAssignee(task, req.user) ? idOf(task.createdBy) : idOf(task.assignedTo);
  return sendNotification(io, {
    recipientId,
    senderId: req.user._id,
    type,
    message,
    hrTaskId: task._id,
  });
};

const serverError = (res, label, error, fallback) => {
  console.error(`[${label} Error]:`, error);
  return res.status(500).json({
    success: false,
    message: error.message || fallback,
  });
};

const notFound = (res) =>
  res.status(404).json({ success: false, message: "HR Task not found" });

const forbidden = (res, message = "You do not have access to this HR task") =>
  res.status(403).json({ success: false, message });

// One-time migration of tasks still using the old workflow statuses
const migrateLegacyStatuses = async () => {
  try {
    for (const [oldStatus, newStatus] of Object.entries(LEGACY_STATUS_MAP)) {
      const update = { $set: { status: newStatus } };
      if (oldStatus === "Cancelled") update.$set.holdReason = "Cancelled (moved from old workflow)";
      const result = await HrTask.collection.updateMany({ status: oldStatus }, update);
      if (result.modifiedCount) {
        console.log(`[HrTask] Migrated ${result.modifiedCount} task(s): ${oldStatus} -> ${newStatus}`);
      }
    }
    // Completed tasks without completedAt (approved under the old workflow)
    await HrTask.collection.updateMany(
      { status: "Completed", completedAt: { $in: [null] } },
      [{ $set: { completedAt: { $ifNull: ["$review.reviewedAt", "$lastUpdated"] } } }]
    );
  } catch (err) {
    console.error("[HrTask] Legacy status migration failed:", err.message);
  }
};
exports.migrateLegacyStatuses = migrateLegacyStatuses;

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
      query.assignedTo = req.user._id;
    } else if (assignedTo && assignedTo !== "all") {
      query.assignedTo = assignedTo;
    }

    if (status && status !== "all" && STATUSES.includes(status)) query.status = status;
    if (priority && priority !== "all") query.priority = priority;
    if (category && category !== "all") query.category = category;

    if (search && search.trim()) {
      const searchRegex = new RegExp(escapeRegex(search.trim()), "i");
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    // Due date filters (day based, open tasks only except "completed")
    const today = startOfDay();
    const tomorrow = new Date(today.getTime() + DAY_MS);

    const openOnly = () => {
      if (!query.status) query.status = { $in: OPEN_STATUSES };
    };

    if (dueDateFilter === "overdue") {
      query.dueDate = { $lt: today };
      if (query.status === "Completed") query.status = "__none__";
      openOnly();
    } else if (dueDateFilter === "due_soon") {
      query.dueDate = { $gte: today, $lt: new Date(today.getTime() + 4 * DAY_MS) };
      openOnly();
    } else if (dueDateFilter === "today") {
      query.dueDate = { $gte: today, $lt: tomorrow };
    } else if (dueDateFilter === "this_week") {
      query.dueDate = { $gte: today, $lt: new Date(today.getTime() + 7 * DAY_MS) };
    } else if (dueDateFilter === "completed") {
      query.status = "Completed";
    }

    const allowedSort = ["createdAt", "dueDate", "lastUpdated", "priority", "title", "status"];
    const sortField = allowedSort.includes(sortBy) ? sortBy : "createdAt";
    const sortObj = { [sortField]: sortOrder === "asc" ? 1 : -1 };

    const tasks = await HrTask.find(query).populate(hrTaskPopulateConfig).sort(sortObj);

    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    serverError(res, "getHrTasks", error, "Server Error fetching HR tasks");
  }
};

// Count statuses / overdue / due soon for a set of tasks
const summarize = (tasks, now) => {
  const counts = {
    total: tasks.length,
    open: 0,
    notStarted: 0,
    inProgress: 0,
    onHold: 0,
    completed: 0,
    overdue: 0,
    dueSoon: 0,
  };
  tasks.forEach((t) => {
    if (t.status === "Not Started") counts.notStarted++;
    else if (t.status === "In Progress") counts.inProgress++;
    else if (t.status === "On Hold") counts.onHold++;
    else if (t.status === "Completed") counts.completed++;
    if (OPEN_STATUSES.includes(t.status)) counts.open++;
    if (isTaskOverdue(t, now)) counts.overdue++;
    if (isTaskDueSoon(t, now)) counts.dueSoon++;
  });
  counts.completionRate = counts.total ? Math.round((counts.completed / counts.total) * 100) : 0;
  return counts;
};

// @desc    Dashboard counts & workload metrics
// @route   GET /api/hr-tasks/metrics
// @access  Private
exports.getHrTaskMetrics = async (req, res) => {
  try {
    const now = new Date();
    const isManager = isManagerOrAdmin(req.user);
    const userId = req.user._id.toString();

    const scope = isManager ? {} : { assignedTo: req.user._id };
    const tasks = await HrTask.find(scope).select("status dueDate assignedTo");

    const counts = summarize(tasks, now);
    const myCounts = summarize(
      tasks.filter((t) => idOf(t.assignedTo) === userId),
      now
    );

    let workload = [];
    if (isManager) {
      const hrUsers = await User.find({
        $or: [{ role: "humanresource" }, { department: { $regex: /human resource|hr/i } }],
        employmentStatus: { $ne: "relieved" },
        accountStatus: { $ne: "inactive" },
      })
        .select("name email role department profileImage profile")
        .populate("profile", "profileImage");

      workload = hrUsers.map((user) => ({
        user,
        ...summarize(
          tasks.filter((t) => idOf(t.assignedTo) === user._id.toString()),
          now
        ),
      }));
    }

    res.status(200).json({
      success: true,
      data: { counts, myCounts, workload },
    });
  } catch (error) {
    serverError(res, "getHrTaskMetrics", error, "Server Error fetching metrics");
  }
};

// @desc    Get HR team members for assignment
// @route   GET /api/hr-tasks/hr-users
// @access  Private
exports.getHrUsers = async (req, res) => {
  try {
    let users = await User.find({
      $or: [{ role: "humanresource" }, { department: { $regex: /human resource|hr/i } }],
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

    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    serverError(res, "getHrUsers", error, "Server Error fetching HR users");
  }
};

// @desc    Get single HR task details
// @route   GET /api/hr-tasks/:id
// @access  Private
exports.getHrTaskById = async (req, res) => {
  try {
    const task = await loadPopulated(req.params.id);
    if (!task) return notFound(res);
    if (!canAccessTask(task, req.user)) return forbidden(res);

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    serverError(res, "getHrTaskById", error, "Server Error fetching task details");
  }
};

// @desc    Create new HR task (Manager assigns; HR self-assigns)
// @route   POST /api/hr-tasks
// @access  Private
exports.createHrTask = async (req, res) => {
  try {
    const {
      title,
      description,
      category = "General HR",
      priority = "Medium",
      dueDate,
      checklist = [],
      attachments = [],
    } = req.body;

    const isManager = isManagerOrAdmin(req.user);
    const assignedTo = isManager ? req.body.assignedTo : req.user._id;
    const isSelfAssigned = !!assignedTo && assignedTo.toString() === req.user._id.toString();

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Please provide a task title" });
    }
    if (!dueDate || isNaN(new Date(dueDate).getTime())) {
      return res.status(400).json({ success: false, message: "Please provide a valid due date" });
    }
    if (!assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Please assign this task to an HR team member",
      });
    }

    const assignedUser = await User.findById(assignedTo);
    if (!assignedUser) {
      return res.status(404).json({ success: false, message: "Assigned user not found" });
    }

    const formattedChecklist = (Array.isArray(checklist) ? checklist : [])
      .map((item) => (typeof item === "string" ? item : item?.item || "").trim())
      .filter(Boolean)
      .map((item) => ({ item, completed: false }));

    const newTask = new HrTask({
      title: title.trim(),
      description: (description || "").trim(),
      category: (category || "General HR").trim(),
      priority,
      status: "Not Started",
      dueDate: new Date(dueDate),
      assignedTo,
      createdBy: req.user._id,
      checklist: formattedChecklist,
      attachments: Array.isArray(attachments) ? attachments : [],
      activityHistory: [
        {
          action: "Task Created",
          details: isSelfAssigned
            ? `Task created and self-assigned by ${assignedUser.name}`
            : `Task created and assigned to ${assignedUser.name}`,
          performedBy: req.user._id,
          timestamp: new Date(),
        },
      ],
      lastUpdated: new Date(),
    });

    await newTask.save();

    await sendNotification(req.app.get("io"), {
      recipientId: assignedTo,
      senderId: req.user._id,
      type: "hr_task_assigned",
      message: `New HR task assigned: "${newTask.title}" (Due: ${new Date(dueDate).toLocaleDateString()})`,
      hrTaskId: newTask._id,
    });

    res.status(201).json({
      success: true,
      message: "HR task created successfully",
      data: await loadPopulated(newTask._id),
    });
  } catch (error) {
    serverError(res, "createHrTask", error, "Server Error creating task");
  }
};

// @desc    Edit, reassign, or update task details (Manager/Admin)
// @route   PUT /api/hr-tasks/:id
// @access  Private (Manager/Admin)
exports.updateHrTask = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return forbidden(res, "Only Managers or Admins can edit HR task details");
    }

    const task = await HrTask.findById(req.params.id);
    if (!task) return notFound(res);

    const { title, description, category, priority, dueDate, assignedTo, checklist, attachments } =
      req.body;
    const changes = [];
    const io = req.app.get("io");

    if (title && title.trim() !== task.title) {
      changes.push(`Title updated from "${task.title}" to "${title.trim()}"`);
      task.title = title.trim();
    }

    if (description !== undefined && (description || "").trim() !== task.description) {
      task.description = (description || "").trim();
      changes.push("Description updated");
    }

    if (category && category !== task.category) {
      changes.push(`Category changed from ${task.category} to ${category}`);
      task.category = category;
    }

    if (priority && priority !== task.priority) {
      changes.push(`Priority changed from ${task.priority} to ${priority}`);
      task.priority = priority;
    }

    if (dueDate && new Date(dueDate).getTime() !== new Date(task.dueDate).getTime()) {
      changes.push(
        `Due date changed from ${new Date(task.dueDate).toLocaleDateString()} to ${new Date(
          dueDate
        ).toLocaleDateString()}`
      );
      task.dueDate = new Date(dueDate);
      task.dueSoonNotified = false;
    }

    const oldAssigneeId = idOf(task.assignedTo);
    let reassignedTo = null;
    if (assignedTo && assignedTo.toString() !== oldAssigneeId) {
      const [newAssignee, oldAssignee] = await Promise.all([
        User.findById(assignedTo),
        User.findById(oldAssigneeId),
      ]);
      if (!newAssignee) {
        return res.status(404).json({ success: false, message: "Assigned user not found" });
      }
      changes.push(
        `Reassigned from ${oldAssignee ? oldAssignee.name : "Previous Assignee"} to ${newAssignee.name}`
      );
      task.assignedTo = assignedTo;
      reassignedTo = assignedTo;
    }

    if (Array.isArray(checklist)) {
      const existing = new Map(task.checklist.map((c) => [c._id.toString(), c]));
      task.checklist = checklist
        .filter((c) => c && (c.item || "").trim())
        .map((c) => {
          const prev = c._id ? existing.get(c._id.toString()) : null;
          return {
            _id: prev ? prev._id : undefined,
            item: c.item.trim(),
            completed: prev ? prev.completed : false,
            completedAt: prev ? prev.completedAt : null,
            completedBy: prev ? prev.completedBy : null,
          };
        });
      changes.push("Checklist updated");
    }

    if (Array.isArray(attachments)) task.attachments = attachments;

    if (changes.length > 0) logActivity(task, req.user, "Task Updated", changes.join(" | "));

    await task.save();

    if (reassignedTo) {
      await sendNotification(io, {
        recipientId: reassignedTo,
        senderId: req.user._id,
        type: "hr_task_assigned",
        message: `HR task reassigned to you: "${task.title}"`,
        hrTaskId: task._id,
      });
    } else if (changes.length > 0) {
      await sendNotification(io, {
        recipientId: task.assignedTo,
        senderId: req.user._id,
        type: "hr_task_updated",
        message: `Task "${task.title}" was updated by ${req.user.name || "Manager"}`,
        hrTaskId: task._id,
      });
    }

    res.status(200).json({
      success: true,
      message: "HR task updated successfully",
      data: await loadPopulated(task._id),
    });
  } catch (error) {
    serverError(res, "updateHrTask", error, "Server Error updating task");
  }
};

// @desc    Change task status: Not Started | In Progress | On Hold | Completed
// @route   PATCH /api/hr-tasks/:id/status
// @body    { status, reason? }  (reason required for On Hold)
// @access  Private (Assignee or Manager)
exports.updateHrTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reason = (req.body.reason || "").trim();

    if (!STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${STATUSES.join(", ")}`,
      });
    }

    const task = await HrTask.findById(req.params.id);
    if (!task) return notFound(res);

    const isManager = isManagerOrAdmin(req.user);
    if (!canAccessTask(task, req.user)) return forbidden(res);

    const oldStatus = task.status;
    if (oldStatus === status && !(status === "On Hold" && reason)) {
      return res.status(200).json({
        success: true,
        message: `Task is already ${status}`,
        data: await loadPopulated(task._id),
      });
    }

    // Reopening a completed task is a manager decision
    if (oldStatus === "Completed" && !isManager) {
      return forbidden(res, "Only a Manager can reopen a completed task");
    }

    if (status === "On Hold" && !reason) {
      return res.status(400).json({
        success: false,
        message: "Please provide a reason for putting the task On Hold",
      });
    }

    const now = new Date();
    task.status = status;

    if (status === "On Hold") {
      task.holdReason = reason;
    } else {
      task.holdReason = "";
    }

    if (status === "In Progress" && !task.startedAt) task.startedAt = now;

    if (status === "Completed") {
      task.completedAt = now;
      task.completedBy = req.user._id;
      if (!task.startedAt) task.startedAt = now;
    } else {
      task.completedAt = null;
      task.completedBy = null;
    }

    let action = "Status Changed";
    if (status === "In Progress" && oldStatus === "Not Started") action = "Task Started";
    else if (status === "In Progress" && oldStatus === "On Hold") action = "Task Resumed";
    else if (status === "In Progress" && oldStatus === "Completed") action = "Task Reopened";
    else if (status === "On Hold") action = "Task Put On Hold";
    else if (status === "Completed") action = "Task Completed";

    logActivity(
      task,
      req.user,
      action,
      `Status changed from ${oldStatus} to ${status}${reason ? ` — Reason: "${reason}"` : ""}`
    );

    // Hold reason also goes to the notes so both sides see it in discussion
    if (status === "On Hold") {
      task.comments.push({
        user: req.user._id,
        text: `On Hold: ${reason}`,
        isFeedback: true,
        createdAt: now,
      });
    }

    await task.save();

    const verb =
      status === "Completed"
        ? "completed"
        : status === "On Hold"
        ? `put On Hold (${reason.slice(0, 60)})`
        : status === "In Progress"
        ? oldStatus === "Not Started"
          ? "started"
          : "moved to In Progress"
        : "moved to Not Started";

    await notifyCounterpart(
      req,
      task,
      "hr_task_status",
      `"${task.title}" was ${verb} by ${req.user.name || "a team member"}`
    );

    res.status(200).json({
      success: true,
      message: `Task status updated to ${status}`,
      data: await loadPopulated(task._id),
    });
  } catch (error) {
    serverError(res, "updateHrTaskStatus", error, "Server Error updating status");
  }
};

// @desc    Toggle checklist item (Assignee or Manager)
// @route   PATCH /api/hr-tasks/:id/checklist/:itemId
// @access  Private
exports.toggleChecklistItem = async (req, res) => {
  try {
    const { id, itemId } = req.params;
    const task = await HrTask.findById(id);
    if (!task) return notFound(res);
    if (!canAccessTask(task, req.user)) return forbidden(res);

    if (task.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Task is completed. Reopen it to change the checklist.",
      });
    }

    const item = task.checklist.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: "Checklist item not found" });
    }

    item.completed = !item.completed;
    item.completedAt = item.completed ? new Date() : null;
    item.completedBy = item.completed ? req.user._id : null;

    // Ticking the first item starts the task automatically
    if (item.completed && task.status === "Not Started") {
      task.status = "In Progress";
      if (!task.startedAt) task.startedAt = new Date();
      logActivity(task, req.user, "Task Started", "Task automatically started on checklist progress");
    }

    logActivity(
      task,
      req.user,
      "Checklist Item Updated",
      `"${item.item}" marked as ${item.completed ? "Done" : "Not Done"}`
    );

    await task.save();

    res.status(200).json({ success: true, data: await loadPopulated(task._id) });
  } catch (error) {
    serverError(res, "toggleChecklistItem", error, "Server Error toggling checklist item");
  }
};

// @desc    Add comment or progress note
// @route   POST /api/hr-tasks/:id/comments
// @access  Private
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const task = await HrTask.findById(id);
    if (!task) return notFound(res);
    if (!canAccessTask(task, req.user)) return forbidden(res);

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text cannot be empty" });
    }

    task.comments.push({
      user: req.user._id,
      text: text.trim(),
      isFeedback: false,
      createdAt: new Date(),
    });
    logActivity(task, req.user, "Comment Added", text.trim().slice(0, 100));

    await task.save();

    await notifyCounterpart(
      req,
      task,
      "hr_task_comment",
      `New note on "${task.title}": ${text.trim().slice(0, 70)}`
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: await loadPopulated(task._id),
    });
  } catch (error) {
    serverError(res, "addComment", error, "Server Error adding comment");
  }
};

// @desc    Delete HR Task (Manager/Admin)
// @route   DELETE /api/hr-tasks/:id
// @access  Private (Manager/Admin)
exports.deleteHrTask = async (req, res) => {
  try {
    if (!isManagerOrAdmin(req.user)) {
      return forbidden(res, "Only Managers or Admins can delete HR tasks");
    }

    const { id } = req.params;
    const task = await HrTask.findById(id);
    if (!task) return notFound(res);

    await HrTask.findByIdAndDelete(id);
    await Notification.deleteMany({ hrTask: id });

    res.status(200).json({ success: true, message: "HR Task deleted successfully" });
  } catch (error) {
    serverError(res, "deleteHrTask", error, "Server Error deleting task");
  }
};

// @desc    Upload attachment for HR task
// @route   POST /api/hr-tasks/upload
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    let fileUrl = "";
    try {
      const result = await uploadMedia(req.file, "hr_tasks");
      fileUrl = result.secure_url;
    } catch (uploadErr) {
      console.error("[uploadAttachment S3 Error]:", uploadErr);
      return res.status(500).json({
        success: false,
        message: "File upload failed: " + (uploadErr.message || "S3 error"),
      });
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
    serverError(res, "uploadAttachment", error, "Server Error uploading attachment");
  }
};
