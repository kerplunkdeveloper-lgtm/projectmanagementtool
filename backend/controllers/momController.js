const Mom = require('../models/Mom');
const User = require('../models/User');
const Notification = require('../models/Notification');

const sendMomNotification = async (req, mom, isNew) => {
  const managementUsers = await User.find({
    role: { $in: ['admin', 'operationmanager'] },
  }).select('_id');

  const recipients = new Set(managementUsers.map((u) => u._id.toString()));

  if (mom.assignedTo) {
    recipients.add(mom.assignedTo.toString());
  }

  recipients.delete(req.user.id); // don't notify self

  const io = req.app.get('io');
  const message = isNew 
    ? `A new MOM point was assigned: ${mom.title}`
    : `A MOM point assignment was updated: ${mom.title}`;

  for (const recipientId of recipients) {
    const notification = await Notification.create({
      recipient: recipientId,
      sender: req.user.id,
      type: 'general',
      message: message,
    });

    if (io) {
      io.to(recipientId).emit('new_notification', notification);
    }
  }
};

// @desc    Get all MOMs
// @route   GET /api/moms
// @access  Private
exports.getMoms = async (req, res, next) => {
  try {
    let queryOptions = {};

    const isCurrentUserAdminOrOp = req.user.role === 'admin' || req.user.role === 'operationmanager';
    const deptLower = req.user.department ? req.user.department.toLowerCase() : '';
    const isCurrentUserSocialMedia = deptLower.includes('social manager') || 
                                     deptLower.includes('social media manager') || 
                                     deptLower.includes('social media executive');

    if (isCurrentUserSocialMedia && !isCurrentUserAdminOrOp) {
      queryOptions = {
        $or: [
          { createdBy: req.user.id },
          { assignedTo: req.user.id }
        ]
      };
    } else if (isCurrentUserAdminOrOp) {
      // If the prompt meant admins also only see their own, it would be { createdBy: req.user.id }
      // But typically admins see all. The phrase "admin and operation manager created panna mom points mattum avanum"
      // most likely means SM managers should see them. However, just in case they meant admins see only their own:
      // Let's assume admins see all for now unless specified.
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

    if (mom.assignedTo) {
      await sendMomNotification(req, mom, true);
    }

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

    // Allow admin, operationmanager, or the creator to update
    if (
      mom.createdBy.toString() !== req.user.id &&
      req.user.role !== 'admin' &&
      req.user.role !== 'operationmanager'
    ) {
      return res.status(401).json({ success: false, message: `User not authorized to update this MOM` });
    }

    const oldAssignedTo = mom.assignedTo ? mom.assignedTo.toString() : null;
    const newAssignedTo = req.body.assignedTo;
    let isAssignmentChanged = false;

    if (newAssignedTo && newAssignedTo !== oldAssignedTo) {
      req.body.isRead = false;
      isAssignmentChanged = true;
    }

    mom = await Mom.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (isAssignmentChanged && newAssignedTo) {
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
