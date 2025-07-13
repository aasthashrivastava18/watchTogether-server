// const express = require('express');
// const { body } = require('express-validator');
// const {
//   sendMessage,
//   getRoomChatHistory,
//   addReaction,
//   deleteMessage
// } = require('../controllers/chatController');
// const auth = require('../middleware/auth');

// const router = express.Router();

// // Send message with validation
// router.post('/send', auth, [
//   body('roomId')
//     .notEmpty()
//     .withMessage('Room ID is required'),
//   body('message')
//     .trim()
//     .isLength({ min: 1, max: 500 })
//     .withMessage('Message must be between 1 and 500 characters'),
//   body('messageType')
//     .optional()
//     .isIn(['text', 'emoji', 'system'])
//     .withMessage('Invalid message type')
// ], sendMessage);

// // Get room chat history
// router.get('/room/:roomId', auth, getRoomChatHistory);

// // Add reaction to message
// router.post('/reaction/:chatId', auth, [
//   body('emoji')
//     .notEmpty()
//     .withMessage('Emoji is required')
// ], addReaction);

// // Delete message
// router.delete('/:chatId', auth, deleteMessage);

// module.exports = router;
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Use 'auth' instead of 'protect'
const {
  sendMessage,
  getRoomChatHistory,  // ✅ Correct function name
  addReaction,
  deleteMessage
} = require('../controllers/chatController');

// @route   GET /api/chat/:roomId
// @desc    Get chat history for a room
// @access  Private
router.get('/:roomId', auth, getRoomChatHistory);

// @route   POST /api/chat
// @desc    Send message to room
// @access  Private
router.post('/', auth, sendMessage);

// @route   POST /api/chat/:chatId/reaction
// @desc    Add reaction to message
// @access  Private
router.post('/:chatId/reaction', auth, addReaction);

// @route   DELETE /api/chat/:chatId
// @desc    Delete a message
// @access  Private
router.delete('/:chatId', auth, deleteMessage);

module.exports = router;

