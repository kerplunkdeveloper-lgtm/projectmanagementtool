const ClientCall = require('../models/ClientCall');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Client = require('../models/Client');

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

// @desc    Create a new client call
// @route   POST /api/client-calls
// @access  Private
exports.createCall = async (req, res) => {
  try {
    const { date, client, discussionPoints, startTime, endTime, duration } = req.body;

    // Optional: Validation
    if (!client || !startTime || !endTime || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    if (isSocialMediaHeadUser(req.user) && client) {
      const clientObj = await Client.findById(client).lean();
      if (!clientObj || !clientObj.branch || !/^chennai$/i.test(clientObj.branch)) {
        return res.status(403).json({
          success: false,
          message: 'Social Media Head can only log calls for Chennai branch clients',
        });
      }
    }

    const clientCall = await ClientCall.create({
      date: date || Date.now(),
      client,
      discussionPoints,
      startTime,
      endTime,
      duration,
      createdBy: req.user ? req.user._id : null,
    });

    const populatedCall = await ClientCall.findById(clientCall._id)
      .populate('client', 'companyName')
      .populate({
        path: 'createdBy',
        select: 'name email department profile',
        populate: { path: 'profile', select: 'profileImage' },
      });

    // Notify Operation Managers
    if (req.user) {
      const opsManagers = await User.find({ role: 'operationmanager' });
      if (opsManagers.length > 0) {
        const notificationPromises = opsManagers.map(manager => {
          return Notification.create({
            recipient: manager._id,
            sender: req.user._id,
            type: 'client_call_created',
            message: `${req.user.name} logged a new client call for ${populatedCall.client?.companyName || 'Client'}.`,
          });
        });

        const createdNotifications = await Promise.all(notificationPromises);

        const io = req.app.get('io');
        if (io) {
          for (let i = 0; i < opsManagers.length; i++) {
            const manager = opsManagers[i];
            const notif = createdNotifications[i];
            const populatedNotification = await Notification.findById(notif._id).populate({ path: 'sender', select: 'name profile', populate: { path: 'profile', select: 'profileImage' } });
            io.to(manager._id.toString()).emit('notification', populatedNotification);
          }
        }
      }
    }

    res.status(201).json({
      success: true,
      data: populatedCall,
    });
  } catch (error) {
    console.error('Error creating client call:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Get all client calls
// @route   GET /api/client-calls
// @access  Private
exports.getCalls = async (req, res) => {
  try {
    let query = {};
    if (isSocialMediaHeadUser(req.user)) {
      const chennaiClients = await Client.find({ branch: new RegExp('^chennai$', 'i') }).select('_id').lean();
      const chennaiClientIds = chennaiClients.map((c) => c._id);
      const chennaiUsers = await User.find({ location: new RegExp('^chennai$', 'i') }).select('_id').lean();
      const chennaiUserIds = chennaiUsers.map((u) => u._id);
      const myId = req.user.id || req.user._id;

      query = {
        $or: [
          { client: { $in: chennaiClientIds } },
          { createdBy: { $in: [...chennaiUserIds, myId].filter(Boolean) } },
        ],
      };
    }

    const calls = await ClientCall.find(query)
      .populate('client', 'companyName status branch')
      .populate({
        path: 'createdBy',
        select: 'name email department profile location',
        populate: { path: 'profile', select: 'profileImage' },
      })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      count: calls.length,
      data: calls,
    });
  } catch (error) {
    console.error('Error fetching client calls:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Delete a client call
// @route   DELETE /api/client-calls/:id
// @access  Private
exports.deleteCall = async (req, res) => {
  try {
    const call = await ClientCall.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call record not found',
      });
    }

    if (isSocialMediaHeadUser(req.user)) {
      if (call.client) {
        const clientObj = await Client.findById(call.client).select('branch').lean();
        if (clientObj && clientObj.branch && !/^chennai$/i.test(clientObj.branch)) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to delete calls outside Chennai branch',
          });
        }
      }
    }

    await call.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    console.error('Error deleting client call:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

// @desc    Update a client call
// @route   PUT /api/client-calls/:id
// @access  Private
exports.updateCall = async (req, res) => {
  try {
    let call = await ClientCall.findById(req.params.id);

    if (!call) {
      return res.status(404).json({
        success: false,
        message: 'Call record not found',
      });
    }

    if (isSocialMediaHeadUser(req.user)) {
      if (call.client) {
        const clientObj = await Client.findById(call.client).select('branch').lean();
        if (clientObj && clientObj.branch && !/^chennai$/i.test(clientObj.branch)) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to update calls outside Chennai branch',
          });
        }
      }
      if (req.body.client) {
        const newClientObj = await Client.findById(req.body.client).select('branch').lean();
        if (newClientObj && newClientObj.branch && !/^chennai$/i.test(newClientObj.branch)) {
          return res.status(403).json({
            success: false,
            message: 'Social Media Head can only assign calls to Chennai branch clients',
          });
        }
      }
    }

    call = await ClientCall.findByIdAndUpdate(
      req.params.id,
      req.body,
      { returnDocument: 'after', runValidators: true }
    )
      .populate('client', 'companyName branch')
      .populate({
        path: 'createdBy',
        select: 'name email department profile location',
        populate: { path: 'profile', select: 'profileImage' },
      });

    res.status(200).json({
      success: true,
      data: call,
    });
  } catch (error) {
    console.error('Error updating client call:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
