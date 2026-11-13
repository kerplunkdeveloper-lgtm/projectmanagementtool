const SocialmediaTaskCalendor = require('../models/SocialmediaTaskCalendor');
const Client = require('../models/Client');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Helper to determine if a user belongs to Social Media Head department
const isSocialMediaHeadUser = (user) => {
  if (!user) return false;
  const role = (user.role || '').toLowerCase().replace(/[\s_]/g, '');
  const dept = (user.department || '').toLowerCase().trim();
  if (role.includes('executive') || dept.includes('executive')) return false;
  return (
    role === 'socialmediamanager' ||
    role === 'socialmediahead' ||
    dept.includes('social media head') ||
    dept.includes('social media manager') ||
    dept.includes('social media')
  );
};

// Helper to determine if a task is a Commitment task
const isCommitmentTask = (bodyOrDoc) => {
  if (!bodyOrDoc) return false;
  if (bodyOrDoc.commitment !== undefined && bodyOrDoc.commitment !== null) {
    return Boolean(bodyOrDoc.commitment);
  }
  const cat = (bodyOrDoc.category || '').trim().toLowerCase();
  return cat === 'content calendar' || cat === 'content calendor' || cat === 'content';
};

// Helper to remove any duplicate tasks based on taskTitle + clientName + publishDate (manual endpoint only)
const cleanDuplicates = async () => {
  try {
    const all = await SocialmediaTaskCalendor.find().sort({ createdAt: 1 });
    const seen = new Set();
    const toDelete = [];

    for (const doc of all) {
      const pDate = doc.publishDate ? new Date(doc.publishDate).toISOString().slice(0, 10) : 'nodate';
      const key = `${(doc.taskTitle || '').trim().toLowerCase()}___${(doc.clientName || '').trim().toLowerCase()}___${pDate}`;
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

// @desc    Get metadata (dynamic clients and users) for task creation/editing
// @route   GET /api/socialmedia-task-calendar/meta
// @access  Private
exports.getSocialmediaMetadata = async (req, res) => {
  try {
    const clientQuery = isSocialMediaHeadUser(req.user)
      ? { branch: new RegExp('^chennai$', 'i') }
      : {};
    const clients = await Client.find(clientQuery).select('companyName color industry posts reels story branch').sort({ companyName: 1 });
    const users = await User.find({ accountStatus: { $ne: 'inactive' } }).select('name role department email').sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: {
        clients,
        users,
        categories: [
          'Content Calendar',
          'Content Creation',
          'Ad campaign check',
          'Google review reply',
          'Engagement monitor',
          'Platform qc',
          'Client app',
          'Influencer',
          'Client call',
          'Model arrangement',
          'Content kt',
          'Business development',
          'Competitor analysis',
          'Trend analysis',
          'Insight report',
        ],
        contentTypes: ['Post', 'Reels', 'Stories', 'Others Task'],
        platforms: ['Instagram', 'Facebook', 'YouTube', 'GMB', 'Twitter', 'LinkedIn'],
        statuses: [
          'Not started',
          'In progress',
          'Inprogress',
          'In QC',
          'QC',
          'Scheduled',
          'Overdue',
          'Completed',
          'Live',
          'Published',
          'Published Live',
          'Completed and wait CLient Approval',
          'Waiting for Response',
        ],
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
    const deptLower = (req.user?.department || '').toLowerCase();
    const isSocialMediaManager =
      userRole === 'socialmediamanager' ||
      userRole === 'socialmediahead' ||
      deptLower.includes('social media head');
    const isPrivileged =
      userRole === 'admin' ||
      userRole === 'operationmanager' ||
      isSocialMediaManager;

    const query = {};

    // Allow regular users to see tasks they created or are assigned to
    let userCreatorCondition = null;
    if (!isPrivileged && req.user) {
      userCreatorCondition = {
        $or: [
          { createdBy: req.user._id },
          { createdByName: req.user.name },
          { assignee: req.user._id },
          { assigneeName: req.user.name },
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
            { assignee: creatorVal },
            { assigneeName: creatorVal },
          ],
        };
      } else {
        userCreatorCondition = {
          $or: [
            { createdByName: new RegExp(`^${creatorVal}$`, 'i') },
            { assigneeName: new RegExp(`^${creatorVal}$`, 'i') },
          ],
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
      const normalizedMonth = Math.max(0, Math.min(11, m - 1));
      // Pad 10 days before and after to include calendar padding days and crossing week views
      const start = new Date(y, normalizedMonth, 1 - 10, 0, 0, 0, 0);
      const end = new Date(y, normalizedMonth + 1, 10, 23, 59, 59, 999);

      query.$or = [
        { publishDate: { $gte: start, $lte: end } },
        { publishDate: null, dueDate: { $gte: start, $lte: end } },
      ];
    }

    // Restrict strictly to Chennai branch clients for Social Media Head
    let chennaiBranchCondition = null;
    if (isSocialMediaHeadUser(req.user)) {
      const chennaiClients = await Client.find({ branch: new RegExp('^chennai$', 'i') }).select('_id companyName').lean();
      const chennaiClientIds = chennaiClients.map((c) => c._id);
      const chennaiClientNames = chennaiClients.map((c) => c.companyName).filter(Boolean);
      chennaiBranchCondition = {
        $or: [
          { client: { $in: chennaiClientIds } },
          { clientName: { $in: chennaiClientNames.map((n) => new RegExp(`^${n}$`, 'i')) } },
        ],
      };
    }

    // Combine any OR conditions safely using $and if multiple exist
    const andClauses = [];
    if (userCreatorCondition) andClauses.push(userCreatorCondition);
    if (searchCondition) andClauses.push(searchCondition);
    if (dateCondition) andClauses.push(dateCondition);
    if (chennaiBranchCondition) andClauses.push(chennaiBranchCondition);

    if (andClauses.length === 1) {
      Object.assign(query, andClauses[0]);
    } else if (andClauses.length > 1) {
      query.$and = andClauses;
    }

    const baseCountFilter = {
      ...(userCreatorCondition || {}),
      ...(chennaiBranchCondition || {}),
    };

    const [rawTasks, totalCount, commitmentsCount] = await Promise.all([
      SocialmediaTaskCalendor.find(query)
      .populate('client', 'companyName color icon industry posts reels story')
      .populate({
        path: 'assignee',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      })
      .populate({
        path: 'createdBy',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      })
      .sort({ publishDate: 1, dueDate: 1, createdAt: -1 })
      .lean(),
      SocialmediaTaskCalendor.countDocuments(baseCountFilter),
      SocialmediaTaskCalendor.countDocuments({
        ...baseCountFilter,
        commitment: true,
      }),
    ]);

    const now = new Date();
    let tasks = rawTasks.map((t) => {
      let isAtRisk = false;
      if (
        t.commitment &&
        !['Completed', 'Live', 'Published', 'Published Live', 'Completed and wait CLient Approval', 'Completed and wait Client Approval'].includes(t.status)
      ) {
        const targetDate = t.publishDate || t.dueDate;
        if (targetDate) {
          const diffHours = (new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60);
          isAtRisk = diffHours >= 0 && diffHours <= 24;
        }
      }
      return { ...t, isAtRisk };
    });

    // Filter "atRisk" if requested (diffHours >= 0 && diffHours <= 24)
    if (atRisk === 'true' || atRisk === true) {
      tasks = tasks.filter((t) => t.isAtRisk);
    }

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
    const deptLower = (req.user?.department || '').toLowerCase();
    const isSocialMediaManager =
      userRole === 'socialmediamanager' ||
      userRole === 'socialmediahead' ||
      deptLower.includes('social media head');
    const isPrivileged =
      userRole === 'admin' ||
      userRole === 'operationmanager' ||
      isSocialMediaManager;

    const commitmentsQuery = {
      commitment: true,
      publishDate: { $gte: startOfMonth, $lte: endOfMonth },
    };

    if (!isPrivileged && req.user) {
      commitmentsQuery.$or = [
        { createdBy: req.user._id },
        { createdByName: req.user.name },
        { assignee: req.user._id },
        { assigneeName: req.user.name },
      ];
    }

    if (isSocialMediaHeadUser(req.user)) {
      const chennaiClients = await Client.find({ branch: new RegExp('^chennai$', 'i') }).select('_id companyName').lean();
      const chennaiClientIds = chennaiClients.map((c) => c._id);
      const chennaiClientNames = chennaiClients.map((c) => c.companyName).filter(Boolean);
      const chennaiCondition = {
        $or: [
          { client: { $in: chennaiClientIds } },
          { clientName: { $in: chennaiClientNames.map((n) => new RegExp(`^${n}$`, 'i')) } },
        ],
      };
      if (commitmentsQuery.$or) {
        commitmentsQuery.$and = [{ $or: commitmentsQuery.$or }, chennaiCondition];
        delete commitmentsQuery.$or;
      } else {
        commitmentsQuery.$or = chennaiCondition.$or;
      }
    }

    // Dynamic Commitments planned this month from DB (lean + projection for maximum speed)
    const monthlyCommitments = await SocialmediaTaskCalendor.find(commitmentsQuery)
      .select('status publishDate dueDate commitment clientName')
      .lean();

    const totalCommitments = monthlyCommitments.length;

    // Dynamic Completed / published on time
    const completedTasks = monthlyCommitments.filter((t) =>
      ['Completed', 'Live', 'Published', 'Published Live', 'Completed and wait CLient Approval', 'Completed and wait Client Approval'].includes(t.status)
    );
    const completedCount = completedTasks.length;

    // Dynamic Overdue tasks
    const overdueTasks = monthlyCommitments.filter((t) => {
      if (['Completed', 'Live', 'Published', 'Published Live', 'Completed and wait CLient Approval', 'Completed and wait Client Approval'].includes(t.status)) return false;
      const pub = new Date(t.publishDate);
      return pub < now || t.status === 'Overdue';
    });
    const overdueCount = overdueTasks.length;

    // Dynamic Pending in production or QC
    const pendingTasks = monthlyCommitments.filter((t) =>
      ['In QC', 'QC', 'Completed and wait CLient Approval', 'Scheduled', 'In progress', 'Inprogress', 'Not started'].includes(t.status) &&
      new Date(t.publishDate) >= now
    );
    const pendingCount = pendingTasks.length;

    // Dynamic At risk: commitment + due within 24h + not completed (diffHours >= 0 && diffHours <= 24)
    const atRiskTasks = monthlyCommitments.filter((t) => {
      if (['Completed', 'Live', 'Published', 'Published Live', 'Completed and wait CLient Approval', 'Completed and wait Client Approval'].includes(t.status)) return false;
      const targetDate = t.publishDate || t.dueDate;
      if (!targetDate) return false;
      const diffHours = (new Date(targetDate).getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffHours >= 0 && diffHours <= 24;
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
      .populate('client', 'companyName color icon industry posts reels story')
      .populate({
        path: 'assignee',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      })
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
    const userRole = (req.user?.role || '').toLowerCase().replace(/[\s_]/g, '');
    if (userRole === 'admin' || userRole === 'operationmanager') {
      return res.status(403).json({
        success: false,
        message: 'You have read-only access to Content Calendar',
      });
    }

    if (isSocialMediaHeadUser(req.user)) {
      if (isCommitmentTask(req.body)) {
        return res.status(403).json({
          success: false,
          message: 'Social Media Head has read-only access to Content Calendar and can only create SME tasks',
        });
      }
    }

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

    // Category determines commitment & onCalendar rule
    const cat = (body.category || '').trim().toLowerCase();
    const isContentCalendar =
      body.commitment === true ||
      (body.commitment === undefined &&
        (cat === 'content calendar' || cat === 'content calendor' || cat === 'content'));

    if (isContentCalendar) {
      body.commitment = true;
      if (body.publishDate && !isNaN(new Date(body.publishDate).getTime())) {
        body.onCalendar = true;
      } else {
        body.onCalendar = false;
      }
    } else {
      body.commitment = false;
      body.onCalendar = false;
      body.contentType = 'Others Task';
      body.publishDate = null;
    }

    body.createdBy = req.user ? req.user.id : (body.createdBy || null);
    body.createdByName = req.user ? req.user.name : (body.createdByName || 'Admin');

    let task = await SocialmediaTaskCalendor.create(body);
    task = await task.populate('client', 'companyName color icon industry posts reels story');
    task = await task.populate({
      path: 'assignee',
      select: 'name email role profile',
      populate: { path: 'profile', select: 'profileImage' },
    });
    task = await task.populate({
      path: 'createdBy',
      select: 'name email role profile',
      populate: { path: 'profile', select: 'profileImage' },
    });

    // Send Real-time Notifications for SME task to Admin, Operation Manager, Social Media Head & Assignee
    try {
      if (!isContentCalendar) {
        const creatorName = (req.user && req.user.name) || task.createdByName || 'Team member';
        const clientDisplayName = task.clientName || (task.client && task.client.companyName) || 'General';
        const taskCategory = task.category || 'SME task';
        const taskTitle = task.taskTitle;

        const notifMessage = `${creatorName} created a new SME task: "${taskTitle}" [${taskCategory}] for ${clientDisplayName}.`;

        const senderIdStr = (req.user && req.user._id) ? req.user._id.toString() : '';

        const recipients = await User.find({
          $or: [
            { role: 'admin' },
            { role: 'operationmanager' },
            { role: 'socialmediamanager' },
            { role: 'socialmediahead' },
            { department: { $regex: /social media head/i } },
          ],
          accountStatus: { $ne: 'inactive' },
        });

        // Filter out the creator if they are among recipients
        const recipientMap = new Map();
        recipients.forEach((u) => {
          if (u._id.toString() !== senderIdStr) {
            recipientMap.set(u._id.toString(), u);
          }
        });

        // Also include assignee if assigned, active, and not the creator
        if (task.assignee) {
          const assigneeIdStr = (typeof task.assignee === 'object' ? task.assignee._id : task.assignee)?.toString();
          if (assigneeIdStr && assigneeIdStr !== senderIdStr && !recipientMap.has(assigneeIdStr)) {
            const assigneeUser = await User.findById(assigneeIdStr);
            if (assigneeUser && assigneeUser.accountStatus !== 'inactive') {
              recipientMap.set(assigneeIdStr, assigneeUser);
            }
          }
        }

        const finalRecipients = Array.from(recipientMap.values());
        if (finalRecipients.length > 0) {
          const notifPromises = finalRecipients.map((r) =>
            Notification.create({
              recipient: r._id,
              sender: (req.user && req.user._id) || r._id,
              type: 'sm_task_created',
              message: notifMessage,
              clientName: clientDisplayName,
              tab: 'sme',
              smTaskId: task._id,
            })
          );

          const createdNotifs = await Promise.all(notifPromises);
          const io = req.app ? req.app.get('io') : null;
          if (io) {
            for (let i = 0; i < finalRecipients.length; i++) {
              const r = finalRecipients[i];
              const notif = createdNotifs[i];
              const populatedNotification = await Notification.findById(notif._id).populate({
                path: 'sender',
                select: 'name profile department role',
                populate: { path: 'profile', select: 'profileImage' },
              });
              io.to(r._id.toString()).emit('notification', populatedNotification);
              io.to(r._id.toString()).emit('new_notification', populatedNotification);
            }
          }
        }
      }
    } catch (notifErr) {
      console.error('[SocialmediaTaskCalendor] Notification error:', notifErr.message);
    }

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
    const userRole = (req.user?.role || '').toLowerCase().replace(/[\s_]/g, '');
    if (userRole === 'admin' || userRole === 'operationmanager') {
      return res.status(403).json({
        success: false,
        message: 'You have read-only access to Content Calendar',
      });
    }

    const existing = await SocialmediaTaskCalendor.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (isSocialMediaHeadUser(req.user)) {
      if (isCommitmentTask(existing) || isCommitmentTask(req.body)) {
        return res.status(403).json({
          success: false,
          message: 'Social Media Head has read-only access to Commitment tasks and can only update SME tasks',
        });
      }
    }

    const body = { ...req.body };

    // Recalculate commitment & onCalendar rule based on category or explicit commitment
    let isContentCalendar = undefined;
    if (body.commitment !== undefined) {
      isContentCalendar = Boolean(body.commitment);
    } else if (body.category !== undefined) {
      const cat = (body.category || '').trim().toLowerCase();
      isContentCalendar =
        cat === 'content calendar' ||
        cat === 'content calendor' ||
        cat === 'content';
    }

    if (isContentCalendar !== undefined) {
      if (isContentCalendar) {
        body.commitment = true;
        if (body.publishDate !== undefined) {
          body.onCalendar = Boolean(body.publishDate && !isNaN(new Date(body.publishDate).getTime()));
          if (!body.onCalendar) body.publishDate = null;
        }
      } else {
        body.commitment = false;
        body.onCalendar = false;
        body.contentType = 'Others Task';
        body.publishDate = null;
      }
    } else if (body.publishDate !== undefined) {
      if (body.publishDate && !isNaN(new Date(body.publishDate).getTime())) {
        body.onCalendar = true;
      } else {
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

    // Authorization check for regular users
    if (req.user) {
      const existing = await SocialmediaTaskCalendor.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      const isCreator = existing.createdBy && existing.createdBy.toString() === req.user._id.toString();
      const isAssignee = existing.assignee && existing.assignee.toString() === req.user._id.toString();
      if (!isCreator && !isAssignee) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify this task' });
      }
    }

    const task = await SocialmediaTaskCalendor.findByIdAndUpdate(
      req.params.id,
      body,
      { returnDocument: 'after', runValidators: true }
    )
      .populate('client', 'companyName color icon industry posts reels story')
      .populate({
        path: 'assignee',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      })
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
    const userRole = (req.user?.role || '').toLowerCase().replace(/[\s_]/g, '');
    if (userRole === 'admin' || userRole === 'operationmanager' || isSocialMediaHeadUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You have read-only access to Content Calendar',
      });
    }

    if (req.user) {
      const existing = await SocialmediaTaskCalendor.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Task not found' });
      }
      const isCreator = existing.createdBy && existing.createdBy.toString() === req.user._id.toString();
      const isAssignee = existing.assignee && existing.assignee.toString() === req.user._id.toString();
      if (!isCreator && !isAssignee) {
        return res.status(403).json({ success: false, message: 'Not authorized to reschedule this task' });
      }
    }

    const { publishDate, dueDate } = req.body;

    const updateData = {};
    if (publishDate) {
      updateData.publishDate = new Date(publishDate);
      updateData.commitment = true;
      updateData.onCalendar = true;
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }

    const task = await SocialmediaTaskCalendor.findByIdAndUpdate(
      req.params.id,
      updateData,
      { returnDocument: 'after' }
    )
      .populate('client', 'companyName color icon industry posts reels story')
      .populate({
        path: 'assignee',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      })
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
    const userRole = (req.user?.role || '').toLowerCase().replace(/[\s_]/g, '');
    if (userRole === 'admin' || userRole === 'operationmanager') {
      return res.status(403).json({
        success: false,
        message: 'You have read-only access to Content Calendar',
      });
    }

    const existing = await SocialmediaTaskCalendor.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    if (isSocialMediaHeadUser(req.user)) {
      if (isCommitmentTask(existing)) {
        return res.status(403).json({
          success: false,
          message: 'Social Media Head has read-only access to Commitment tasks and can only delete SME tasks',
        });
      }
    }

    if (req.user) {
      const deptLower = (req.user?.department || '').toLowerCase();
      const isSocialMediaManager =
        userRole === 'socialmediamanager' ||
        userRole === 'socialmediahead' ||
        deptLower.includes('social media head');
      const isCreator = existing.createdBy && existing.createdBy.toString() === req.user._id.toString();
      if (!isCreator && !isSocialMediaManager && existing.createdBy) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this task' });
      }
    }

    const task = await SocialmediaTaskCalendor.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found',
      });
    }

    await Notification.deleteMany({ smTaskId: req.params.id }).catch(() => {});

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

// @desc    Bulk delete social media tasks
// @route   POST /api/socialmedia-task-calendar/bulk-delete
// @access  Private
exports.bulkDeleteSocialmediaTasks = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase().replace(/[\s_]/g, '');
    if (userRole === 'admin' || userRole === 'operationmanager' || isSocialMediaHeadUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You have read-only access to Content Calendar',
      });
    }

    const { taskIds } = req.body;
    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No task IDs provided for deletion',
      });
    }

    const deptLower = (req.user?.department || '').toLowerCase();
    const isSocialMediaManager =
      userRole === 'socialmediamanager' ||
      userRole === 'socialmediahead' ||
      deptLower.includes('social media head');

    const filter = { _id: { $in: taskIds } };
    if (!isSocialMediaManager && req.user) {
      filter.$or = [
        { createdBy: req.user._id },
        { createdBy: null },
        { createdBy: { $exists: false } },
      ];
    }

    const deleteResult = await SocialmediaTaskCalendor.deleteMany(filter);
    await Notification.deleteMany({ smTaskId: { $in: taskIds } }).catch(() => {});

    res.status(200).json({
      success: true,
      message: `${deleteResult.deletedCount} task(s) deleted successfully`,
      deletedCount: deleteResult.deletedCount,
      deletedIds: taskIds,
    });
  } catch (error) {
    console.error('[SocialmediaTaskCalendor] bulkDeleteSocialmediaTasks error:', error);
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
    const userRole = (req.user?.role || '').toLowerCase().replace(/[\s_]/g, '');
    if (userRole === 'admin' || userRole === 'operationmanager' || isSocialMediaHeadUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You have read-only access to Content Calendar',
      });
    }

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

// @desc    Bulk import commitment tasks (Excel/CSV import)
// @route   POST /api/socialmedia-task-calendar/bulk-import
// @access  Private

// Smart date parser supporting DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD, Excel serials, etc.
function parseSmartDate(dateInput, timeInput) {
  if (!dateInput) return null;
  const str = String(dateInput).trim();
  if (!str) return null;

  let hours = 18;
  let minutes = 0;
  if (timeInput) {
    const tMatch = String(timeInput).trim().match(/(\d{1,2}):(\d{2})/);
    if (tMatch) {
      hours = parseInt(tMatch[1], 10);
      minutes = parseInt(tMatch[2], 10);
    }
  }

  // Excel serial number (e.g. 45601)
  if (/^\d{5}$/.test(str)) {
    const days = parseInt(str, 10);
    const d = new Date(Math.round((days - 25569) * 86400 * 1000));
    if (!isNaN(d.getTime())) {
      d.setHours(hours, minutes, 0, 0);
      return d;
    }
  }

  // DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    let p2 = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    let day = p1;
    let month = p2 - 1;

    if (p1 > 12 && p2 <= 12) {
      day = p1;
      month = p2 - 1;
    } else if (p2 > 12 && p1 <= 12) {
      day = p2;
      month = p1 - 1;
    } else {
      // In India / Asia, DD/MM/YYYY is standard
      day = p1;
      month = p2 - 1;
    }

    return new Date(year, month, day, hours, minutes, 0, 0);
  }

  // YYYY-MM-DD or YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10) - 1;
    const day = parseInt(ymdMatch[3], 10);
    return new Date(year, month, day, hours, minutes, 0, 0);
  }

  // Word parsed: "5 Nov 2026", "Nov 5, 2026"
  const direct = new Date(str + (timeInput ? ' ' + timeInput : ''));
  if (!isNaN(direct.getTime())) {
    return direct;
  }

  return null;
}

// @desc    Bulk import commitment tasks (Excel/CSV import)
// @route   POST /api/socialmedia-task-calendar/bulk-import
// @access  Private
exports.bulkImportSocialmediaTasks = async (req, res) => {
  try {
    const userRole = (req.user?.role || '').toLowerCase().replace(/[\s_]/g, '');
    if (userRole === 'admin' || userRole === 'operationmanager' || isSocialMediaHeadUser(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You have read-only access to Content Calendar',
      });
    }
    const tasksRaw = Array.isArray(req.body) ? req.body : req.body.tasks;
    if (!tasksRaw || !Array.isArray(tasksRaw) || tasksRaw.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No tasks provided for import',
      });
    }

    // Dynamic Client and User caches for fast mapping
    const allClients = await Client.find({}).select('_id companyName color');
    const allUsers = await User.find({ accountStatus: { $ne: 'inactive' } }).select('_id name email');

    const clientMap = new Map();
    allClients.forEach((c) => {
      if (c.companyName) {
        clientMap.set(c.companyName.trim().toLowerCase(), c);
      }
    });

    const userMap = new Map();
    allUsers.forEach((u) => {
      if (u.name) userMap.set(u.name.trim().toLowerCase(), u);
      if (u.email) userMap.set(u.email.trim().toLowerCase(), u);
    });

    const validTasksToCreate = [];
    const errors = [];

    for (let i = 0; i < tasksRaw.length; i++) {
      const row = tasksRaw[i];
      const rowIndex = i + 1;

      const title = (row.taskTitle || row.title || '').trim();
      const rawClientName = (row.clientName || row.client || '').trim();

      if (!title) {
        errors.push('Row ' + rowIndex + ': Task Title is required.');
        continue;
      }
      if (!rawClientName) {
        errors.push('Row ' + rowIndex + ': Client Name is required.');
        continue;
      }

      // Resolve client
      let clientDoc = null;
      if (row.client && typeof row.client === 'string' && row.client.match(/^[0-9a-fA-F]{24}$/)) {
        clientDoc = allClients.find((c) => c._id.toString() === row.client);
      }
      if (!clientDoc && rawClientName) {
        clientDoc = clientMap.get(rawClientName.toLowerCase());
      }

      const clientName = clientDoc ? clientDoc.companyName : rawClientName;
      const clientColor = clientDoc ? (clientDoc.color || '#6366f1') : (row.clientColor || '#6366f1');
      const clientId = clientDoc ? clientDoc._id : null;

      // Resolve assignee
      let assigneeDoc = null;
      const rawAssignee = (row.assigneeName || row.assignee || '').trim();
      if (row.assignee && typeof row.assignee === 'string' && row.assignee.match(/^[0-9a-fA-F]{24}$/)) {
        assigneeDoc = allUsers.find((u) => u._id.toString() === row.assignee);
      }
      if (!assigneeDoc && rawAssignee) {
        assigneeDoc = userMap.get(rawAssignee.toLowerCase());
      }

      const assigneeId = assigneeDoc ? assigneeDoc._id : null;
      const assigneeName = assigneeDoc ? assigneeDoc.name : (rawAssignee || 'Unassigned');

      // Platforms parsing
      let platforms = [];
      if (Array.isArray(row.platforms)) {
        platforms = row.platforms.map((p) => String(p).trim()).filter(Boolean);
      } else if (typeof row.platforms === 'string') {
        platforms = row.platforms
          .split(/[,;|]/)
          .map((p) => p.trim())
          .filter(Boolean);
      }
      if (platforms.length === 0) {
        platforms = ['Instagram'];
      }

      // Completed platforms
      let completedPlatforms = [];
      if (Array.isArray(row.completedPlatforms)) {
        completedPlatforms = row.completedPlatforms.map((p) => String(p).trim()).filter(Boolean);
      } else if (typeof row.completedPlatforms === 'string') {
        completedPlatforms = row.completedPlatforms
          .split(/[,;|]/)
          .map((p) => p.trim())
          .filter(Boolean);
      }

      // Smart Dates parsing
      let publishDate = parseSmartDate(row.publishDate, row.publishTime);
      let dueDate = parseSmartDate(row.dueDate, row.publishTime || '18:00');

      if (!publishDate && dueDate) {
        publishDate = new Date(dueDate);
      }
      if (!dueDate && publishDate) {
        dueDate = new Date(publishDate);
      }
      if (!publishDate && !dueDate) {
        publishDate = new Date();
        dueDate = new Date();
      }

      // Priority
      let priority = 'Medium';
      const rawPriority = (row.priority || '').trim().toLowerCase();
      if (rawPriority.includes('high')) priority = 'High';
      else if (rawPriority.includes('low')) priority = 'Low';
      else priority = 'Medium';

      // Status
      let status = 'Not started';
      const rawStatus = (row.status || '').trim();
      const validStatuses = [
        'Not started',
        'In progress',
        'Inprogress',
        'In QC',
        'QC',
        'Scheduled',
        'Overdue',
        'Completed',
        'Live',
        'Published',
        'Published Live',
        'Completed and wait CLient Approval',
        'Completed and wait Client Approval',
        'Waiting for Response',
      ];
      const matchedStatus = validStatuses.find(
        (s) => s.toLowerCase() === rawStatus.toLowerCase()
      );
      if (matchedStatus) {
        status = matchedStatus;
      }

      // Content Type
      let contentType = 'Post';
      const rawType = (row.contentType || row.type || '').trim().toLowerCase();
      if (rawType.includes('reel')) contentType = 'Reels';
      else if (rawType.includes('stori') || rawType.includes('story')) contentType = 'Stories';
      else if (rawType.includes('other')) contentType = 'Others Task';
      else contentType = 'Post';

      const taskDoc = {
        taskTitle: title,
        client: clientId,
        clientName,
        clientColor,
        category: 'Content',
        contentType,
        platforms,
        completedPlatforms,
        assignee: assigneeId,
        assigneeName,
        dueDate,
        publishDate,
        priority,
        status,
        qc: row.qc || '-',
        commitment: true,
        onCalendar: true,
        notes: (row.notes || row.caption || '').trim(),
        createdBy: req.user ? (req.user._id || req.user.id) : null,
        createdByName: req.user ? req.user.name : 'Imported',
      };

      validTasksToCreate.push(taskDoc);
    }

    if (validTasksToCreate.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid tasks could be processed from the imported data.',
        errors,
      });
    }

    // Insert tasks
    const createdRaw = await SocialmediaTaskCalendor.create(validTasksToCreate);

    // Populate for immediate return to frontend Redux state
    const createdIds = createdRaw.map((t) => t._id);
    const populatedTasks = await SocialmediaTaskCalendor.find({ _id: { $in: createdIds } })
      .populate('client', 'companyName color icon industry posts reels story')
      .populate({
        path: 'assignee',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      })
      .populate({
        path: 'createdBy',
        select: 'name email role profile',
        populate: { path: 'profile', select: 'profileImage' },
      });

    res.status(201).json({
      success: true,
      count: populatedTasks.length,
      data: populatedTasks,
      message: 'Successfully imported ' + populatedTasks.length + ' commitment posts to Content Calendar!',
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('[SocialmediaTaskCalendor] bulkImportSocialmediaTasks error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during bulk import',
    });
  }
};
