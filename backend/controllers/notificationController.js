const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort('-createdAt')
      .populate({
        path: 'sender',
        select: 'name profile department role',
        populate: {
          path: 'profile',
          select: 'profileImage',
        },
      })
      .populate({
        path: 'client',
        select: 'companyName',
      })
      .populate({
        path: 'project',
        select: 'name client',
        populate: {
          path: 'client',
          select: 'companyName',
        },
      })
      .populate({
        path: 'task',
        select: 'title project client',
        populate: {
          path: 'project',
          select: 'name client',
          populate: {
            path: 'client',
            select: 'companyName',
          },
        },
      })
      .populate({
        path: 'hrTask',
        select: 'title category status priority dueDate',
      })
      .limit(30)
      .lean();

    res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unread chat notification counts
// @route   GET /api/notifications/unread-chat-counts
// @access  Private
exports.getUnreadChatCounts = async (req, res) => {
  try {
    const userId = req.user._id;
    const unreadNotifications = await Notification.find({
      recipient: userId,
      isRead: false,
      type: { $in: ['message_received', 'mention_received'] },
    }).select('chatRoomId chatRoomType');

    const unreadByChat = {};
    unreadNotifications.forEach((n) => {
      const key = n.chatRoomId || 'group';
      unreadByChat[key] = (unreadByChat[key] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      totalUnread: unreadNotifications.length,
      unreadByChat,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notifications for a specific chat room as read
// @route   PUT /api/notifications/chat/:chatRoomId/read
// @access  Private
exports.markChatAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const { chatRoomId } = req.params;

    await Notification.updateMany(
      {
        recipient: userId,
        chatRoomId: chatRoomId,
        isRead: false,
        type: { $in: ['message_received', 'mention_received'] },
      },
      { $set: { isRead: true } }
    );

    const remainingUnread = await Notification.countDocuments({
      recipient: userId,
      isRead: false,
      type: { $in: ['message_received', 'mention_received'] },
    });

    res.status(200).json({
      success: true,
      chatRoomId,
      remainingUnread,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all chat notifications as read
// @route   PUT /api/notifications/read-all-chat
// @access  Private
exports.markAllChatAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        isRead: false,
        type: { $in: ['message_received', 'mention_received'] },
      },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All chat notifications marked as read',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted',
      data: req.params.id,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
