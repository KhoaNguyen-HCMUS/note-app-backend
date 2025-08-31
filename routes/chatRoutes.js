const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getMessages,
  sendMessage,
  markAsRead,
  getChatUsers,
  searchUsers,
  getUnreadCount,
  testDatabase
} = require('../controllers/chatController');

router.use(protect);

router.get('/users', getChatUsers);

router.get('/search-users', searchUsers);

router.get('/messages/:userId', getMessages);

// Test endpoint (tạm thời)
router.get('/test-db', testDatabase);

router.post('/messages', sendMessage);

router.put('/messages/read/:senderId', markAsRead);

router.get('/unread-count', getUnreadCount);

module.exports = router;
