const express = require('express');
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload'); // ✅ Only one import

const {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomDetails,
  getUserRooms,
  updateRoomSettings,
  setVideoUrl,     // ✅ Add missing import
  uploadVideo      // ✅ Add missing import
} = require('../controllers/roomController');

const router = express.Router();

// Create room with validation
router.post('/create', auth, [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Room name must be between 1 and 50 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must be less than 200 characters')
], createRoom);

// Join room
router.post('/join/:roomId', auth, joinRoom);

// Leave room
router.post('/leave/:roomId', auth, leaveRoom);

// Get room details
router.get('/:roomId', auth, getRoomDetails);

// Get user's rooms
router.get('/user/rooms', auth, getUserRooms);

// Update room settings
router.put('/:roomId/settings', auth, updateRoomSettings);

// ✅ Video routes (fixed)
router.post('/set-video-url/:roomId', auth, setVideoUrl);
router.post('/upload-video/:roomId', auth, upload.single('video'), uploadVideo);

module.exports = router;
