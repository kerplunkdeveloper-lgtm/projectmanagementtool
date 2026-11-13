const sanitizeUserDept = (u) => {
  if (!u) return;
  if (u.department && u.department.toLowerCase() === 'social media manager') {
    u.department = 'Social Media Executive';
  }
};
const Mom = require('../models/Mom');
const User = require('../models/User');
const Client = require('../models/Client');
const Notification = require('../models/Notification');

const isSocialMediaHeadUser = (user) => {
  if (!user) return false;
  const dept = (user.department || '').toLowerCase();
  const role = (user.role || '').toLowerCase();
  if (dept.includes('social media executive') || dept.includes('executive')) return false;
  return (
    role === 'socialmediamanager' ||
    role === 'socialmediahead' ||
    dept.includes('social media head') ||
    dept.includes('social media manager')
  );
};

// Optimized non-blocking notification dispatcher
const sendMomNotification = async (app, userId, mom, isNew) => {
  try {
    const io = app ? app.get('io') : null;
    const sender = await User.findById(userId)
      .select('name role department profile')
      .populate('profile', 'profileImage')
      .lean();
    const senderName = sender?.name || 'Someone';

    const assignedToId = mom.assignedTo?._id
      ? mom.assignedTo._id.toString()
      : (mom.assignedTo ? mom.assignedTo.toString() : null);

    let assignedUserName = mom.assignedTo?.name;
    if (!assignedUserName && assignedToId) {
      const assignedUser = await User.findById(assignedToId).select('name email role department').lean();
      assignedUserName = assignedUser?.name;
    }

    const managementUsers = await User.find({
      role: { $in: ['admin', 'operationmanager'] },
      accountStatus: { $ne: 'inactive' },
      employmentStatus: { $ne: 'relieved' },
    }).select('_id').lean();

    const notificationsToCreate = [];

    // 1. Notify Assigned User if assigned to someone other than sender
    if (assignedToId && assignedToId !== userId.toString()) {
      notificationsToCreate.push({
        recipient: assignedToId,
        sender: userId,
        type: 'mom_assigned',
        message: `${senderName} assigned a MOM point to you: "${mom.title}"`,
        mom: mom._id,
      });
    }

    // 2. Notify Management Users (Admin & Operation Manager)
    const notifType = isNew ? 'mom_created' : 'mom_updated';
    let adminMessage = '';
    if (isNew) {
      adminMessage = assignedUserName
        ? `${senderName} posted a new MOM point: "${mom.title}" (Assigned to: ${assignedUserName})`
        : `${senderName} posted a new MOM point: "${mom.title}"`;
    } else {
      adminMessage = assignedUserName
        ? `${senderName} assigned MOM point: "${mom.title}" to ${assignedUserName}`
        : `${senderName} updated MOM point: "${mom.title}"`;
    }

    for (const mUser of managementUsers) {
      const mUserId = mUser._id.toString();
      if (mUserId === userId.toString() || (assignedToId && mUserId === assignedToId)) {
        continue;
      }
      notificationsToCreate.push({
        recipient: mUserId,
        sender: userId,
        type: notifType,
        message: adminMessage,
        mom: mom._id,
      });
    }

    if (notificationsToCreate.length > 0) {
      const createdList = await Promise.all(
        notificationsToCreate.map((n) => Notification.create(n).catch((e) => null))
      );

      if (io) {
        createdList.forEach((notif) => {
          if (!notif) return;
          const notifObj = notif.toObject ? notif.toObject() : notif;
          notifObj.sender = sender;
          io.to(notif.recipient.toString()).emit('new_notification', notifObj);
        });
      }
    }
  } catch (err) {
    console.error('Error in sendMomNotification:', err);
  }
};

// @desc    Get all MOMs
// @route   GET /api/moms
// @access  Private
exports.getMoms = async (req, res, next) => {
  try {
    let queryOptions = {};

    if (isSocialMediaHeadUser(req.user)) {
      const chennaiClients = await Client.find({ branch: new RegExp('^chennai$', 'i') }).select('_id').lean();
      const chennaiClientIds = chennaiClients.map((c) => c._id);
      const chennaiUsers = await User.find({ location: new RegExp('^chennai$', 'i') }).select('_id').lean();
      const chennaiUserIds = chennaiUsers.map((u) => u._id);
      const myId = req.user.id || req.user._id;

      queryOptions = {
        $or: [
          { client: { $in: chennaiClientIds } },
          { createdBy: { $in: [...chennaiUserIds, myId].filter(Boolean) } },
          { assignedTo: { $in: [...chennaiUserIds, myId].filter(Boolean) } },
          { client: null },
        ],
      };
    } else {
      const isCurrentUserAdminOrOp =
        req.user.role === 'admin' ||
        req.user.role === 'operationmanager';

      if (!isCurrentUserAdminOrOp) {
        queryOptions = {
          $or: [
            { createdBy: req.user.id },
            { assignedTo: req.user.id }
          ]
        };
      }
    }

    const moms = await Mom.find(queryOptions)
      .populate('client', 'companyName name')
      .populate({ path: 'createdBy', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .populate({ path: 'assignedTo', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .sort({ createdAt: -1 })
      .lean();

    moms.forEach((m) => {
      sanitizeUserDept(m.createdBy);
      sanitizeUserDept(m.assignedTo);
    });

    res.status(200).json({
      success: true,
      count: moms.length,
      data: moms,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single MOM
// @route   GET /api/moms/:id
// @access  Private
exports.getMom = async (req, res, next) => {
  try {
    const mom = await Mom.findById(req.params.id)
      .populate('client', 'companyName name branch')
      .populate({ path: 'createdBy', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .populate({ path: 'assignedTo', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .lean();

    if (!mom) {
      return res.status(404).json({ success: false, message: `MOM not found with id of ${req.params.id}` });
    }

    if (isSocialMediaHeadUser(req.user) && mom.client) {
      const clientObj = await Client.findById(mom.client).select('branch').lean();
      if (clientObj && clientObj.branch && !/^chennai$/i.test(clientObj.branch)) {
        return res.status(403).json({ success: false, message: 'Not authorized to access MOM points outside Chennai branch' });
      }
    }

    sanitizeUserDept(mom.createdBy);
    sanitizeUserDept(mom.assignedTo);
    res.status(200).json({
      success: true,
      data: mom,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new MOM
// @route   POST /api/moms
// @access  Private
exports.createMom = async (req, res, next) => {
  try {
    req.body.createdBy = req.user.id; // From auth middleware

    if (isSocialMediaHeadUser(req.user) && req.body.client) {
      const clientObj = await Client.findById(req.body.client).lean();
      if (!clientObj || !clientObj.branch || !/^chennai$/i.test(clientObj.branch)) {
        return res.status(403).json({ success: false, message: 'Social Media Head can only assign MOM points to Chennai branch clients' });
      }
    }

    if (req.body.assignedTo && req.body.assignedTo !== req.user.id) {
      req.body.isRead = false;
    }

    const createdMom = await Mom.create(req.body);

    const mom = await Mom.findById(createdMom._id)
      .populate('client', 'companyName name')
      .populate({ path: 'createdBy', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .populate({ path: 'assignedTo', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .lean();

    sanitizeUserDept(mom.createdBy);
    sanitizeUserDept(mom.assignedTo);

    // Send notifications in the background - do NOT block response
    const app = req.app;
    const userId = req.user.id;
    setImmediate(() => {
      sendMomNotification(app, userId, mom, true);
    });

    res.status(201).json({
      success: true,
      data: mom,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update MOM
// @route   PUT /api/moms/:id
// @access  Private
exports.updateMom = async (req, res, next) => {
  try {
    let mom = await Mom.findById(req.params.id);

    if (!mom) {
      return res.status(404).json({ success: false, message: `MOM not found with id of ${req.params.id}` });
    }

    const isCreator = mom.createdBy.toString() === req.user.id;
    const isAssigned = mom.assignedTo && mom.assignedTo.toString() === req.user.id;
    const deptLower = req.user.department ? req.user.department.toLowerCase() : '';
    const isSocialMediaManager =
      req.user.role === 'socialmediamanager' ||
      req.user.role === 'socialmediahead' ||
      deptLower.includes('social media head');
    const isAdminOrOp = req.user.role === 'admin' || req.user.role === 'operationmanager' || isSocialMediaManager;
    const isSocialMedia = isSocialMediaManager ||
                          deptLower.includes('social manager') || 
                          deptLower.includes('social media manager') || 
                          deptLower.includes('social media executive');

    // Allow admin, operationmanager, creator, assigned user, or social media executive to update
    if (!isCreator && !isAdminOrOp && !isAssigned && !isSocialMedia) {
      return res.status(401).json({ success: false, message: `User not authorized to update this MOM` });
    }

    if (isSocialMediaHeadUser(req.user)) {
      if (mom.client) {
        const clientObj = await Client.findById(mom.client).select('branch').lean();
        if (clientObj && clientObj.branch && !/^chennai$/i.test(clientObj.branch)) {
          return res.status(403).json({ success: false, message: 'Not authorized to update MOM points outside Chennai branch' });
        }
      }
      if (req.body.client) {
        const newClientObj = await Client.findById(req.body.client).select('branch').lean();
        if (newClientObj && newClientObj.branch && !/^chennai$/i.test(newClientObj.branch)) {
          return res.status(403).json({ success: false, message: 'Social Media Head can only assign MOM points to Chennai branch clients' });
        }
      }
    }

    const oldAssignedTo = mom.assignedTo ? mom.assignedTo.toString() : null;
    const newAssignedTo = req.body.assignedTo !== undefined ? (req.body.assignedTo ? req.body.assignedTo.toString() : null) : oldAssignedTo;
    const isAssignmentChanged = req.body.assignedTo !== undefined && newAssignedTo !== oldAssignedTo;

    if (isAssignmentChanged && newAssignedTo && newAssignedTo !== req.user.id) {
      req.body.isRead = false;
    }

    const updatedMom = await Mom.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: 'after',
      runValidators: true,
    })
      .populate('client', 'companyName name')
      .populate({ path: 'createdBy', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .populate({ path: 'assignedTo', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .lean();

    sanitizeUserDept(updatedMom.createdBy);
    sanitizeUserDept(updatedMom.assignedTo);

    if (isAssignmentChanged) {
      const app = req.app;
      const userId = req.user.id;
      setImmediate(() => {
        sendMomNotification(app, userId, updatedMom, false);
      });
    }

    res.status(200).json({
      success: true,
      data: updatedMom,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete MOM
// @route   DELETE /api/moms/:id
// @access  Private
exports.deleteMom = async (req, res, next) => {
  try {
    const mom = await Mom.findById(req.params.id);

    if (!mom) {
      return res.status(404).json({ success: false, message: `MOM not found with id of ${req.params.id}` });
    }

    const deptLowerDel = (req.user.department || '').toLowerCase();
    const isSocialMediaManagerDel =
      req.user.role === 'socialmediamanager' ||
      req.user.role === 'socialmediahead' ||
      deptLowerDel.includes('social media head');

    if (
      mom.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'operationmanager' &&
      !isSocialMediaManagerDel
    ) {
      return res.status(401).json({ success: false, message: `User not authorized to delete this MOM` });
    }

    if (isSocialMediaHeadUser(req.user) && mom.client) {
      const clientObj = await Client.findById(mom.client).select('branch').lean();
      if (clientObj && clientObj.branch && !/^chennai$/i.test(clientObj.branch)) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete MOM points outside Chennai branch' });
      }
    }

    await mom.deleteOne();

    // Clean up notifications in background asynchronously
    Notification.deleteMany({ mom: req.params.id }).catch(() => {});

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
