const express = require('express');
const {
  getNotifications,
  getUnreadChatCounts,
  markChatAsRead,
  markAsRead,
  markAllAsRead,
  markAllChatAsRead,
  deleteNotification,
} = require('../controllers/notificationController');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.get('/unread-chat-counts', getUnreadChatCounts);
router.put('/read-all', markAllAsRead);
router.put('/read-all-chat', markAllChatAsRead);
router.put('/chat/:chatRoomId/read', markChatAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
