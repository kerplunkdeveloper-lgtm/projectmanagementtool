const Shoot = require('../models/Shoot');
const Notification = require('../models/Notification');

// Helper to convert "hh:mm AM/PM" to comparable number (e.g. "09:00 AM" -> 900, "01:00 PM" -> 1300)
const parseTime = (timeStr) => {
  if (!timeStr) return 0;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (!match) return 0;
  let [ , hours, minutes, period ] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  return hours * 100 + minutes;
};

// Helper to send real-time and DB notifications to assigned users for a shoot
const sendShootAssignmentNotifications = async (io, shoot, recipientsWithRole, sender) => {
  if (!recipientsWithRole || recipientsWithRole.length === 0) return;

  const shootDateStr = shoot.schedule?.shootDate
    ? new Date(shoot.schedule.shootDate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '';
  const timeStr = shoot.schedule?.startTime ? ` at ${shoot.schedule.startTime}` : '';
  const clientName = shoot.client?.companyName ? ` for ${shoot.client.companyName}` : '';

  const notificationsToCreate = [];
  const senderId = (sender._id || sender.id).toString();

  for (const item of recipientsWithRole) {
    const recipientId = item.recipientId ? item.recipientId.toString() : null;
    if (!recipientId || recipientId === senderId) continue;

    let message = '';
    if (item.role === 'lead') {
      message = `You have been assigned as Lead for shoot: "${shoot.shootTitle}"${clientName}${shootDateStr ? ` on ${shootDateStr}` : ''}${timeStr}.`;
    } else {
      message = `You have been added to the shoot team for: "${shoot.shootTitle}"${clientName}${shootDateStr ? ` on ${shootDateStr}` : ''}${timeStr}.`;
    }

    notificationsToCreate.push({
      recipient: recipientId,
      sender: sender._id || sender.id,
      type: 'shoot_assigned',
      message,
      shoot: shoot._id,
    });
  }

  if (notificationsToCreate.length === 0) return;

  try {
    const createdNotifications = await Notification.insertMany(notificationsToCreate);
    if (io) {
      for (const notif of createdNotifications) {
        try {
          const populated = await Notification.findById(notif._id).populate({
            path: 'sender',
            select: 'name profile',
            populate: { path: 'profile', select: 'profileImage' },
          });
          io.to(notif.recipient.toString()).emit('notification', populated);
        } catch (err) {
          console.error('Failed to emit single shoot notification:', err);
        }
      }
    }
  } catch (err) {
    console.error('Failed to create shoot notifications:', err);
  }
};

// @desc    Create new shoot
// @route   POST /api/shoot-calendar
// @access  Private
exports.createShoot = async (req, res) => {
  try {
    const { schedule } = req.body;
    
    // Validate end time > start time if schedule is provided
    if (schedule && schedule.startTime && schedule.endTime) {
      if (parseTime(schedule.endTime) <= parseTime(schedule.startTime)) {
        return res.status(400).json({
          success: false,
          message: 'End time must be after start time'
        });
      }
    }

    req.body.createdBy = req.user.id;
    req.body.status = 'Planned'; // Force default

    const shoot = await Shoot.create(req.body);
    const populatedShoot = await Shoot.findById(shoot._id).populate('client', 'companyName');

    const recipients = [];
    if (populatedShoot.assignedTo) {
      recipients.push({ recipientId: populatedShoot.assignedTo, role: 'lead' });
    }
    if (Array.isArray(populatedShoot.shootTeam)) {
      populatedShoot.shootTeam.forEach((memberId) => {
        if (
          memberId &&
          (!populatedShoot.assignedTo || memberId.toString() !== populatedShoot.assignedTo.toString())
        ) {
          recipients.push({ recipientId: memberId, role: 'team' });
        }
      });
    }

    const io = req.app.get('io');
    await sendShootAssignmentNotifications(io, populatedShoot, recipients, req.user);
    if (io) {
      io.emit('shoot_created', { shootId: shoot._id });
    }

    res.status(201).json({
      success: true,
      data: shoot,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all shoots
// @route   GET /api/shoot-calendar
// @access  Private
exports.getShoots = async (req, res) => {
  try {
    const { startDate, endDate, status, shootType, client } = req.query;
    let query = {};

    if (startDate || endDate) {
      query['schedule.shootDate'] = {};
      if (startDate) query['schedule.shootDate'].$gte = new Date(startDate);
      if (endDate) query['schedule.shootDate'].$lte = new Date(endDate);
    }
    
    if (status) query.status = status;
    if (shootType) query.shootType = shootType;
    if (client) query.client = client;

    // Role-based visibility:
    // Non-admin and non-operationmanager users only see shoots where they are:
    // - Assigned To (Lead)
    // - In the Shoot Team
    // - Creator
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'operationmanager') {
      const userId = req.user._id;
      query.$or = [
        { assignedTo: userId },
        { shootTeam: userId },
        { createdBy: userId }
      ];
    }

    const shoots = await Shoot.find(query)
      .populate('client', 'companyName color icon')
      .populate({
        path: 'assignedTo',
        select: 'name role',
        populate: {
          path: 'profile',
          select: 'profileImage'
        }
      })
      .populate({
        path: 'shootTeam',
        select: 'name role',
        populate: {
          path: 'profile',
          select: 'profileImage'
        }
      })
      .populate('createdBy', 'name')
      .sort({
      'schedule.shootDate': 1,
      'schedule.startTime': 1
    });

    res.status(200).json({
      success: true,
      count: shoots.length,
      data: shoots,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single shoot
// @route   GET /api/shoot-calendar/:id
// @access  Private
exports.getShoot = async (req, res) => {
  try {
    const shoot = await Shoot.findById(req.params.id)
      .populate('client', 'companyName color icon email phone address')
      .populate('assignedTo', 'name email role')
      .populate('shootTeam', 'name email role')
      .populate('createdBy', 'name email');

    if (!shoot) {
      return res.status(404).json({
        success: false,
        message: 'Shoot not found',
      });
    }

    // Role-based authorization for single shoot
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'operationmanager') {
      const userId = (req.user._id || req.user.id).toString();
      const isAssigned = shoot.assignedTo && (shoot.assignedTo._id || shoot.assignedTo).toString() === userId;
      const inTeam = shoot.shootTeam && shoot.shootTeam.some(m => (m._id || m).toString() === userId);
      const isCreator = shoot.createdBy && (shoot.createdBy._id || shoot.createdBy).toString() === userId;

      if (!isAssigned && !inTeam && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this shoot',
        });
      }
    }

    res.status(200).json({
      success: true,
      data: shoot,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Shoot ID format',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update shoot
// @route   PUT /api/shoot-calendar/:id
// @access  Private
exports.updateShoot = async (req, res) => {
  try {
    let shoot = await Shoot.findById(req.params.id);

    if (!shoot) {
      return res.status(404).json({
        success: false,
        message: 'Shoot not found',
      });
    }

    // Only allow updating certain fields to avoid overwriting accidentally
    const { 
      client, shootTitle, shootType, description, schedule, status,
      location, assignedTo, shootTeam, purpose, contentUse, weather, transport,
      estimatedBudget, clientContact, shootSchedule, checklist, notes, specialInstructions, attachedFiles
    } = req.body;
    
    let updateData = { updatedBy: req.user.id };
    
    if (client !== undefined) updateData.client = client;
    if (shootTitle !== undefined) updateData.shootTitle = shootTitle;
    if (shootType !== undefined) updateData.shootType = shootType;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (location !== undefined) updateData.location = location;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo ? assignedTo : null;
    if (shootTeam !== undefined) updateData.shootTeam = Array.isArray(shootTeam) ? shootTeam.filter(Boolean) : [];
    if (purpose !== undefined) updateData.purpose = purpose;
    if (contentUse !== undefined) updateData.contentUse = contentUse;
    if (weather !== undefined) updateData.weather = weather;
    if (transport !== undefined) updateData.transport = transport;
    if (estimatedBudget !== undefined) updateData.estimatedBudget = estimatedBudget;
    if (clientContact !== undefined) updateData.clientContact = clientContact;
    if (shootSchedule !== undefined) updateData.shootSchedule = shootSchedule;
    if (checklist !== undefined) updateData.checklist = checklist;
    if (notes !== undefined) updateData.notes = notes;
    if (specialInstructions !== undefined) updateData.specialInstructions = specialInstructions;
    if (attachedFiles !== undefined) updateData.attachedFiles = attachedFiles;

    if (schedule) {
      updateData.schedule = { ...shoot.schedule.toObject(), ...schedule };
      
      // Validate times if both are present in the final schedule
      if (updateData.schedule.startTime && updateData.schedule.endTime) {
        if (parseTime(updateData.schedule.endTime) <= parseTime(updateData.schedule.startTime)) {
          return res.status(400).json({
            success: false,
            message: 'End time must be after start time'
          });
        }
      }
    }

    const previousAssignedTo = shoot.assignedTo ? shoot.assignedTo.toString() : null;
    const previousTeam = (shoot.shootTeam || []).map((m) => m.toString());

    shoot = await Shoot.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    }).populate('client', 'companyName');

    const newAssignedTo = shoot.assignedTo ? shoot.assignedTo.toString() : null;
    const newTeam = (shoot.shootTeam || []).map((m) => m.toString());

    const recipients = [];
    if (newAssignedTo && newAssignedTo !== previousAssignedTo) {
      recipients.push({ recipientId: newAssignedTo, role: 'lead' });
    }
    newTeam.forEach((mId) => {
      if (!previousTeam.includes(mId) && mId !== newAssignedTo) {
        recipients.push({ recipientId: mId, role: 'team' });
      }
    });

    const io = req.app.get('io');
    await sendShootAssignmentNotifications(io, shoot, recipients, req.user);
    if (io) {
      io.emit('shoot_updated', { shootId: shoot._id });
    }

    res.status(200).json({
      success: true,
      data: shoot,
    });
  } catch (error) {
    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Shoot ID format',
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update shoot status
// @route   PATCH /api/shoot-calendar/:id/status
// @access  Private
exports.updateShootStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = [
      'Planned',
      'Confirmed',
      'In Progress',
      'Completed',
      'Pending Approval',
      'At Risk',
      'Cancelled'
    ];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const shoot = await Shoot.findByIdAndUpdate(
      req.params.id,
      { status, updatedBy: req.user.id },
      { returnDocument: 'after', runValidators: true }
    );

    if (!shoot) {
      return res.status(404).json({
        success: false,
        message: 'Shoot not found',
      });
    }

    res.status(200).json({
      success: true,
      data: shoot,
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Shoot ID format',
      });
    }
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete shoot
// @route   DELETE /api/shoot-calendar/:id
// @access  Private
exports.deleteShoot = async (req, res) => {
  try {
    const shoot = await Shoot.findById(req.params.id);

    if (!shoot) {
      return res.status(404).json({
        success: false,
        message: 'Shoot not found',
      });
    }

    await shoot.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
      message: 'Shoot removed'
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        message: 'Invalid Shoot ID format',
      });
    }
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
