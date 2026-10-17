const Mom = require('../models/Mom');
const User = require('../models/User');
const Notification = require('../models/Notification');

const sendMomNotification = async (req, mom, isNew) => {
  try {
    const io = req.app.get('io');
    const sender = await User.findById(req.user.id).select('name role department profile');
    const senderName = sender?.name || 'Someone';

    let assignedUser = null;
    if (mom.assignedTo) {
      assignedUser = await User.findById(mom.assignedTo).select('name email role department');
    }

    const managementUsers = await User.find({
      role: { $in: ['admin', 'operationmanager'] },
      accountStatus: { $ne: 'inactive' },
      employmentStatus: { $ne: 'relieved' },
    }).select('_id');

    // 1. Notify Assigned User if assigned to someone other than sender
    if (mom.assignedTo && mom.assignedTo.toString() !== req.user.id) {
      const recipientId = mom.assignedTo.toString();
      const assignMessage = `${senderName} assigned a MOM point to you: "${mom.title}"`;

      const notification = await Notification.create({
        recipient: recipientId,
        sender: req.user.id,
        type: 'mom_assigned',
        message: assignMessage,
        mom: mom._id,
      });

      if (io) {
        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'name email profile department role');
        io.to(recipientId).emit('new_notification', populatedNotification || notification);
      }
    }

    // 2. Notify Management Users (Admin & Operation Manager)
    for (const mUser of managementUsers) {
      const mUserId = mUser._id.toString();

      // Don't send duplicate notification if admin is the sender or the assigned recipient
      if (mUserId === req.user.id || (mom.assignedTo && mUserId === mom.assignedTo.toString())) {
        continue;
      }

      let adminMessage = '';
      let notifType = isNew ? 'mom_created' : 'mom_updated';

      if (isNew) {
        if (assignedUser) {
          adminMessage = `${senderName} posted a new MOM point: "${mom.title}" (Assigned to: ${assignedUser.name})`;
        } else {
          adminMessage = `${senderName} posted a new MOM point: "${mom.title}"`;
        }
      } else {
        if (assignedUser) {
          adminMessage = `${senderName} assigned MOM point: "${mom.title}" to ${assignedUser.name}`;
        } else {
          adminMessage = `${senderName} updated MOM point: "${mom.title}"`;
        }
      }

      const notification = await Notification.create({
        recipient: mUserId,
        sender: req.user.id,
        type: notifType,
        message: adminMessage,
        mom: mom._id,
      });

      if (io) {
        const populatedNotification = await Notification.findById(notification._id)
          .populate('sender', 'name email profile department role');
        io.to(mUserId).emit('new_notification', populatedNotification || notification);
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

    const isCurrentUserAdminOrOp = req.user.role === 'admin' || req.user.role === 'operationmanager';

    if (!isCurrentUserAdminOrOp) {
      queryOptions = {
        $or: [
          { createdBy: req.user.id },
          { assignedTo: req.user.id }
        ]
      };
    }

    const query = Mom.find(queryOptions)
      .populate('client', 'companyName name')
      .populate({ path: 'createdBy', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .populate({ path: 'assignedTo', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } });

    const moms = await query.sort({ createdAt: -1 });

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
      .populate('client', 'companyName name')
      .populate({ path: 'createdBy', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } })
      .populate({ path: 'assignedTo', select: 'name email department profile', populate: { path: 'profile', select: 'profileImage' } });

    if (!mom) {
      return res.status(404).json({ success: false, message: `MOM not found with id of ${req.params.id}` });
    }

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

    if (req.body.assignedTo && req.body.assignedTo !== req.user.id) {
      req.body.isRead = false;
    }

    const mom = await Mom.create(req.body);

    // Always send notification when a MOM point is posted
    await sendMomNotification(req, mom, true);

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
    const isAdminOrOp = req.user.role === 'admin' || req.user.role === 'operationmanager';
    const deptLower = req.user.department ? req.user.department.toLowerCase() : '';
    const isSocialMedia = deptLower.includes('social manager') || 
                          deptLower.includes('social media manager') || 
                          deptLower.includes('social media executive');

    // Allow admin, operationmanager, creator, assigned user, or social media manager to update
    if (!isCreator && !isAdminOrOp && !isAssigned && !isSocialMedia) {
      return res.status(401).json({ success: false, message: `User not authorized to update this MOM` });
    }

    const oldAssignedTo = mom.assignedTo ? mom.assignedTo.toString() : null;
    const newAssignedTo = req.body.assignedTo !== undefined ? (req.body.assignedTo ? req.body.assignedTo.toString() : null) : oldAssignedTo;
    const isAssignmentChanged = req.body.assignedTo !== undefined && newAssignedTo !== oldAssignedTo;

    if (isAssignmentChanged && newAssignedTo && newAssignedTo !== req.user.id) {
      req.body.isRead = false;
    }

    mom = await Mom.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (isAssignmentChanged) {
      await sendMomNotification(req, mom, false);
    }

    res.status(200).json({
      success: true,
      data: mom,
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

    if (
      mom.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'operationmanager'
    ) {
      return res.status(401).json({ success: false, message: `User not authorized to delete this MOM` });
    }

    await mom.deleteOne(); // Mongoose 7+ uses deleteOne instead of remove

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
