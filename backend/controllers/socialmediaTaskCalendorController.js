const SocialmediaTaskCalendor = require('../models/SocialmediaTaskCalendor');
const Client = require('../models/Client');
const User = require('../models/User');

// Helper to remove any duplicate tasks based on taskTitle + clientName
const cleanDuplicates = async () => {
  try {
    const all = await SocialmediaTaskCalendor.find().sort({ createdAt: 1 });
    const seen = new Set();
    const toDelete = [];

    for (const doc of all) {
      const key = `${(doc.taskTitle || '').trim().toLowerCase()}___${(doc.clientName || '').trim().toLowerCase()}`;
      if (seen.has(key)) {
        toDelete.push(doc._id);
      } else {
        seen.add(key);
      }
    }

    if (toDelete.length > 0) {
      await SocialmediaTaskCalendor.deleteMany({ _id: { $in: toDelete } });
      console.log(`[SocialmediaTaskCalendor] Cleaned ${toDelete.length} duplicate tasks from database`);
    }
  } catch (err) {
    console.error('[SocialmediaTaskCalendor] Deduplication error:', err);
  }
};

// Run deduplication on startup
cleanDuplicates();

// @desc    Get metadata (dynamic clients and users) for task creation/editing
// @route   GET /api/socialmedia-task-calendar/meta
// @access  Private
exports.getSocialmediaMetadata = async (req, res) => {
  try {
    const clients = await Client.find({}).select('companyName color industry').sort({ companyName: 1 });
    const users = await User.find({ accountStatus: { $ne: 'inactive' } }).select('name role department email').sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: {
        clients,
        users,
        categories: ['Content', 'Copy', 'Posting', 'Engagement', 'Client', 'Ads', 'Strategy', 'Reporting', 'Calendar', 'Audit', 'Other'],
        contentTypes: ['Reel', 'Post', 'Carousel', 'Story', 'GMB', 'YouTube', 'Blog', 'Ad', 'Other'],
        statuses: ['Not started', 'In progress', 'In QC', 'Scheduled', 'Overdue', 'Completed', 'Live'],
        priorities: ['High', 'Medium', 'Low'],
        qcStatuses: ['-', 'Pending', 'Passed', 'Rejected'],
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch metadata',
    });
  }
};

// @desc    Get all social media tasks (100% dynamic from MongoDB)
// @route   GET /api/socialmedia-task-calendar
// @access  Private
exports.getSocialmediaTasks = async (req, res) => {
  try {
    await cleanDuplicates();

    const {
      search,
      client,
      clientName,
      category,
      contentType,
      status,
      priority,
      commitment,
      atRisk,
      onCalendar,
      startDate,
      endDate,
      month,
      year,
      createdBy,
    } = req.query;

    const userRole = (req.user?.role || '').toLowerCase().replace(/[\s_]/g, '');
    const isPrivileged = userRole === 'admin' || userRole === 'operationmanager';

    const query = {};

    // Restrict regular users strictly to tasks they created
    let userCreatorCondition = null;
    if (!isPrivileged && req.user) {
      userCreatorCondition = {
        $or: [
          { createdBy: req.user._id },
          { createdByName: req.user.name },
        ],
      };
    } else if (isPrivileged && createdBy && createdBy !== 'All') {
      const creatorVal = createdBy.trim();
      const mongoose = require('mongoose');
      if (mongoose.Types.ObjectId.isValid(creatorVal)) {
        userCreatorCondition = {
          $or: [
            { createdBy: creatorVal },
            { createdByName: creatorVal },
          ],
        };
      } else {
        userCreatorCondition = {
          createdByName: new RegExp(`^${creatorVal}$`, 'i'),
        };
      }
    }

    // Search term
    let searchCondition = null;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      searchCondition = {
        $or: [
          { taskTitle: regex },
          { taskCode: regex },
          { clientName: regex },
          { assigneeName: regex },
        ],
      };
    }

    // Client filter
    if (client) {
      query.client = client;
    } else if (clientName && clientName !== 'All' && clientName !== 'All clients') {
      query.clientName = clientName;
    }

    // Category filter
    if (category && category !== 'All' && category !== 'All categories') {
      query.category = category;
    }

    // Content type filter
    if (contentType && contentType !== 'All' && contentType !== 'All types') {
      query.contentType = contentType;
    }

    // Status filter
    if (status && status !== 'All' && status !== 'All statuses') {
      query.status = status;
    }

    // Priority filter
    if (priority && priority !== 'All' && priority !== 'All priorities') {
      query.priority = priority;
    }

    // Commitment filter
    if (commitment !== undefined && commitment !== 'All' && commitment !== '') {
      if (commitment === 'Yes' || commitment === 'true' || commitment === true) {
        query.commitment = true;
      } else if (commitment === 'No' || commitment === 'false' || commitment === false) {
        query.commitment = false;
      }
    }

    // On calendar filter
    if (onCalendar !== undefined && onCalendar !== 'All' && onCalendar !== '') {
      if (onCalendar === 'true' || onCalendar === true) {
        query.onCalendar = true;
      } else if (onCalendar === 'false' || onCalendar === false) {
        query.onCalendar = false;
      }
    }

    // Date range filter
    let dateCondition = null;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      dateCondition = {
        $or: [
          { publishDate: { $gte: start, $lte: end } },
          { dueDate: { $gte: start, $lte: end } },
        ],
      };
    } else if (year && month) {
      const y = parseInt(year, 10);
      const m = parseInt(month, 10);
      const normalizedMonth = m > 12 ? 10 : (m === 0 ? 0 : m - 1);
      const start = new Date(y, normalizedMonth, 1);
      const end = new Date(y, normalizedMonth + 1, 0, 23, 59, 59, 999);

      query.publishDate = { $gte: start, $lte: end };
    }

    // Combine any OR conditions safely using $and if multiple exist
    const andClauses = [];
    if (userCreatorCondition) andClauses.push(userCreatorCondition);
    if (searchCondition) andClauses.push(searchCondition);
    if (dateCondition) andClauses.push(dateCondition);

    if (andClauses.length === 1) {
      Object.assign(query, andClauses[0]);
    } else if (andClauses.length > 1) {
      query.$and = andClauses;
    }

    let tasks = await SocialmediaTaskCalendor.find(query)
      .populate('client', 'companyName color icon')
      .populate('assignee', 'name email role')
      .populate({
        path: 'createdBy',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      })
      .sort({ publishDate: 1, dueDate: 1, createdAt: -1 });

    // Filter "atRisk" if requested
    if (atRisk === 'true' || atRisk === true) {
      const now = new Date();
      tasks = tasks.filter((t) => {
        if (!t.commitment) return false;
        if (['Completed', 'Live'].includes(t.status)) return false;
        const targetDate = t.publishDate || t.dueDate;
        if (!targetDate) return false;
        const diffHours = (new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60);
        return diffHours <= 24;
      });
    }

    const baseCountFilter = userCreatorCondition || {};
    const totalCount = await SocialmediaTaskCalendor.countDocuments(baseCountFilter);
    const commitmentsCount = await SocialmediaTaskCalendor.countDocuments({
      ...baseCountFilter,
      commitment: true,
    });

    res.status(200).json({
      success: true,
      count: tasks.length,
      totalCount,
      commitmentsCount,
      data: tasks,
    });
  } catch (error) {
    console.error('[SocialmediaTaskCalendor] getSocialmediaTasks error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get dynamic social media metrics & monthly stats
// @route   GET /api/socialmedia-task-calendar/stats
// @access  Private
exports.getSocialmediaStats = async (req, res) => {
  try {
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();
    const month = parseInt(req.query.month, 10) || (now.getMonth() + 1);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const userRole = (req.user?.role || '').toLowerCase().replace(/[\s_]/g, '');
    const isPrivileged = userRole === 'admin' || userRole === 'operationmanager';

    const commitmentsQuery = {
      commitment: true,
      publishDate: { $gte: startOfMonth, $lte: endOfMonth },
    };

    if (!isPrivileged && req.user) {
      commitmentsQuery.$or = [
        { createdBy: req.user._id },
        { createdByName: req.user.name },
      ];
    }

    // Dynamic Commitments planned this month from DB
    const monthlyCommitments = await SocialmediaTaskCalendor.find(commitmentsQuery);

    const totalCommitments = monthlyCommitments.length;

    // Dynamic Completed / published on time
    const completedTasks = monthlyCommitments.filter((t) =>
      ['Completed', 'Live'].includes(t.status)
    );
    const completedCount = completedTasks.length;

    // Dynamic Overdue tasks
    const overdueTasks = monthlyCommitments.filter((t) => {
      if (['Completed', 'Live'].includes(t.status)) return false;
      const pub = new Date(t.publishDate);
      return pub < now || t.status === 'Overdue';
    });
    const overdueCount = overdueTasks.length;

    // Dynamic Pending in production or QC
    const pendingTasks = monthlyCommitments.filter((t) =>
      ['In QC', 'Scheduled', 'In progress', 'Not started'].includes(t.status) &&
      new Date(t.publishDate) >= now
    );
    const pendingCount = pendingTasks.length;

    // Dynamic At risk: commitment + due within 24h + not completed
    const atRiskTasks = monthlyCommitments.filter((t) => {
      if (['Completed', 'Live'].includes(t.status)) return false;
      const targetDate = t.publishDate || t.dueDate;
      if (!targetDate) return false;
      const diffHours = (new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours <= 24;
    });
    const atRiskCount = atRiskTasks.length;

    const achievement = totalCommitments > 0
      ? parseFloat(((completedCount / totalCommitments) * 100).toFixed(1))
      : 0;

    // Dynamic unique clients with commitments this month
    const clientSet = new Set(monthlyCommitments.map((t) => t.clientName));
    const activeClientsCount = clientSet.size;

    res.status(200).json({
      success: true,
      stats: {
        commitments: totalCommitments,
        completed: completedCount,
        pending: pendingCount,
        overdue: overdueCount,
        atRisk: atRiskCount,
        achievement,
        targetAchievement: 90.0,
        activeClients: activeClientsCount,
        month,
        year,
      },
    });
  } catch (error) {
    console.error('[SocialmediaTaskCalendor] getSocialmediaStats error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Get single task
// @route   GET /api/socialmedia-task-calendar/:id
// @access  Private
exports.getSocialmediaTaskById = async (req, res) => {
  try {
    const task = await SocialmediaTaskCalendor.findById(req.params.id)
      .populate('client', 'companyName color icon')
      .populate('assignee', 'name email role')
      .populate({
        path: 'createdBy',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      data: task,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Create new social media task (100% dynamic linking)
// @route   POST /api/socialmedia-task-calendar
// @access  Private
exports.createSocialmediaTask = async (req, res) => {
  try {
    const body = { ...req.body };
    body.createdBy = req.user ? req.user.id : null;

    // Resolve client dynamically from DB if ID or Name supplied
    if (body.client) {
      const clientDoc = await Client.findById(body.client);
      if (clientDoc) {
        body.clientName = clientDoc.companyName || body.clientName;
        body.clientColor = clientDoc.color || body.clientColor || '#6366f1';
      }
    } else if (body.clientName) {
      const clientDoc = await Client.findOne({ companyName: body.clientName });
      if (clientDoc) {
        body.client = clientDoc._id;
        body.clientColor = clientDoc.color || body.clientColor || '#6366f1';
      }
    }

    // Resolve assignee dynamically from DB if ID or Name supplied
    if (body.assignee) {
      const userDoc = await User.findById(body.assignee);
      if (userDoc) {
        body.assigneeName = userDoc.name || body.assigneeName;
      }
    } else if (body.assigneeName) {
      const userDoc = await User.findOne({ name: body.assigneeName });
      if (userDoc) {
        body.assignee = userDoc._id;
      }
    }

    // Workflow rule: publishDate determines commitment & onCalendar
    if (body.publishDate && !isNaN(new Date(body.publishDate).getTime())) {
      body.commitment = true;
      body.onCalendar = true;
    } else {
      body.commitment = false;
      body.onCalendar = false;
      body.publishDate = null;
    }

    body.createdBy = req.user ? req.user.id : (body.createdBy || null);
    body.createdByName = req.user ? req.user.name : (body.createdByName || 'Admin');

    let task = await SocialmediaTaskCalendor.create(body);
    task = await task.populate('client', 'companyName color icon');
    task = await task.populate('assignee', 'name email role');
    task = await task.populate({
      path: 'createdBy',
      select: 'name email role profile',
      populate: { path: 'profile', select: 'profileImage' },
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: task,
    });
  } catch (error) {
    console.error('[SocialmediaTaskCalendor] createSocialmediaTask error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create task',
    });
  }
};

// @desc    Update social media task
// @route   PUT /api/socialmedia-task-calendar/:id
// @access  Private
exports.updateSocialmediaTask = async (req, res) => {
  try {
    const body = { ...req.body };

    // Recalculate commitment & onCalendar rule
    if (body.publishDate !== undefined) {
      if (body.publishDate && !isNaN(new Date(body.publishDate).getTime())) {
        body.commitment = true;
        body.onCalendar = true;
      } else {
        body.commitment = false;
        body.onCalendar = false;
        body.publishDate = null;
      }
    }

    // Dynamic client linking
    if (body.client) {
      const clientDoc = await Client.findById(body.client);
      if (clientDoc) {
        body.clientName = clientDoc.companyName || body.clientName;
        body.clientColor = clientDoc.color || body.clientColor || '#6366f1';
      }
    } else if (body.clientName) {
      const clientDoc = await Client.findOne({ companyName: body.clientName });
      if (clientDoc) {
        body.client = clientDoc._id;
        body.clientColor = clientDoc.color || body.clientColor || '#6366f1';
      }
    }

    // Dynamic assignee linking
    if (body.assignee) {
      const userDoc = await User.findById(body.assignee);
      if (userDoc) {
        body.assigneeName = userDoc.name || body.assigneeName;
      }
    } else if (body.assigneeName) {
      const userDoc = await User.findOne({ name: body.assigneeName });
      if (userDoc) {
        body.assignee = userDoc._id;
      }
    }

    const task = await SocialmediaTaskCalendor.findByIdAndUpdate(
      req.params.id,
      body,
      { new: true, runValidators: true }
    )
      .populate('client', 'companyName color icon')
      .populate('assignee', 'name email role')
      .populate({
        path: 'createdBy',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task updated successfully',
      data: task,
    });
  } catch (error) {
    console.error('[SocialmediaTaskCalendor] updateSocialmediaTask error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update task',
    });
  }
};

// @desc    Quick reschedule for drag-and-drop on calendar
// @route   PATCH /api/socialmedia-task-calendar/:id/reschedule
// @access  Private
exports.rescheduleSocialmediaTask = async (req, res) => {
  try {
    const { publishDate, dueDate } = req.body;

    const updateData = {};
    if (publishDate) {
      updateData.publishDate = new Date(publishDate);
      updateData.commitment = true;
      updateData.onCalendar = true;
    }
    if (dueDate) {
      updateData.dueDate = new Date(dueDate);
    } else if (publishDate) {
      updateData.dueDate = new Date(publishDate);
    }

    const task = await SocialmediaTaskCalendor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('client', 'companyName color icon')
      .populate('assignee', 'name email role')
      .populate({
        path: 'createdBy',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task rescheduled successfully',
      data: task,
    });
  } catch (error) {
    console.error('[SocialmediaTaskCalendor] rescheduleSocialmediaTask error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to reschedule task',
    });
  }
};

// @desc    Delete social media task
// @route   DELETE /api/socialmedia-task-calendar/:id
// @access  Private
exports.deleteSocialmediaTask = async (req, res) => {
  try {
    const task = await SocialmediaTaskCalendor.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Task deleted successfully',
      data: { id: req.params.id },
    });
  } catch (error) {
    console.error('[SocialmediaTaskCalendor] deleteSocialmediaTask error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};

// @desc    Manually clean duplicate tasks
// @route   POST /api/socialmedia-task-calendar/clean-duplicates
// @access  Private
exports.cleanDuplicateTasks = async (req, res) => {
  try {
    await cleanDuplicates();
    const remainingCount = await SocialmediaTaskCalendor.countDocuments();
    res.status(200).json({
      success: true,
      message: 'Duplicate tasks cleaned successfully',
      remainingCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Server error',
    });
  }
};
