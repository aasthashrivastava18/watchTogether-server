const Room = require('../models/Room');
const Chat = require('../models/Chat');
const { validationResult } = require('express-validator');

// Create Room
const createRoom = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, hostOnlyControl, allowAnonymous } = req.body;
    const room = new Room({
      name,
      description,
      host: req.user.id,
      participants: [{
        user: req.user.id,
        joinedAt: new Date()
      }],
      settings: {
        hostOnlyControl: hostOnlyControl !== undefined ? hostOnlyControl : true,
        allowAnonymous: allowAnonymous !== undefined ? allowAnonymous : false
      }
    });

    await room.save();
    await room.populate('host', 'username email');
    await room.populate('participants.user', 'username email');

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ message: 'Server error while creating room' });
  }
};

// Join Room - FIXED
const joinRoom = async (req, res) => {
  try {
    const { roomId } = req.params; // This is actually roomCode from URL
    const userId = req.user.id;

    // ✅ Fixed: Use roomCode field instead of roomId
    const room = await Room.findOne({ roomCode: roomId, isActive: true })
      .populate('host', 'username email')
      .populate('participants.user', 'username email');

    if (!room) {
      return res.status(404).json({ message: 'Room not found or inactive' });
    }

    // Check if room is full (max 10 users)
    if (room.participants.length >= room.settings.maxParticipants) {
      return res.status(400).json({
        message: 'Room is full. Maximum participants limit reached.'
      });
    }

    // Check if user is already in the room
    const isAlreadyParticipant = room.participants.some(
      participant => participant.user._id.toString() === userId
    );

    if (isAlreadyParticipant) {
      return res.status(400).json({ message: 'You are already in this room' });
    }

    // Add user to room
    room.participants.push({
      user: userId,
      joinedAt: new Date()
    });

    await room.save();
    await room.populate('participants.user', 'username email');

    res.json({
      message: 'Successfully joined the room',
      room
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ message: 'Server error while joining room' });
  }
};

// Leave Room - FIXED
const leaveRoom = async (req, res) => {
  try {
    const { roomId } = req.params; // This is actually roomCode
    const userId = req.user.id;

    // ✅ Fixed: Use roomCode field
    const room = await Room.findOne({ roomCode: roomId, isActive: true });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Remove user from participants
    room.participants = room.participants.filter(
      participant => participant.user.toString() !== userId
    );

    // If host leaves and there are other participants, transfer host to first participant
    if (room.host.toString() === userId && room.participants.length > 0) {
      room.host = room.participants[0].user;
    }

    // If no participants left, deactivate room
    if (room.participants.length === 0) {
      room.isActive = false;
    }

    await room.save();

    res.json({ message: 'Successfully left the room' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ message: 'Server error while leaving room' });
  }
};

// Get Room Details - FIXED
const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;
        
    let room;
        
    // Try to find by roomCode first, then by ObjectId
    if (roomId.length === 24) { // ObjectId length
      room = await Room.findOne({ 
        $or: [
          { roomCode: roomId },
          { _id: roomId }
        ],
        isActive: true 
      })
      .populate('host', 'username email')
      .populate('participants.user', 'username email');
    } else {
      // Short roomCode
      room = await Room.findOne({ roomCode: roomId, isActive: true })
        .populate('host', 'username email')
        .populate('participants.user', 'username email');
    }

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({ room });
  } catch (error) {
    console.error('Get room details error:', error);
    res.status(500).json({ message: 'Server error while fetching room details' });
  }
};

// Get User's Rooms
const getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;

    const rooms = await Room.find({
      $or: [
        { host: userId },
        { 'participants.user': userId }
      ],
      isActive: true
    })
    .populate('host', 'username email')
    .populate('participants.user', 'username email')
    .sort({ updatedAt: -1 });

    res.json({ rooms });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ message: 'Server error while fetching rooms' });
  }
};

// Update Room Settings - FIXED
const updateRoomSettings = async (req, res) => {
  try {
    const { roomId } = req.params; // This is actually roomCode
    const { hostOnlyControl, allowAnonymous } = req.body;
    const userId = req.user.id;

    // ✅ Fixed: Use roomCode field
    const room = await Room.findOne({ roomCode: roomId, isActive: true });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Only host can update settings
    if (room.host.toString() !== userId) {
      return res.status(403).json({ message: 'Only room host can update settings' });
    }

    if (hostOnlyControl !== undefined) {
      room.settings.hostOnlyControl = hostOnlyControl;
    }
    if (allowAnonymous !== undefined) {
      room.settings.allowAnonymous = allowAnonymous;
    }

    await room.save();

    res.json({
      message: 'Room settings updated successfully',
      room
    });
  } catch (error) {
    console.error('Update room settings error:', error);
    res.status(500).json({ message: 'Server error while updating room settings' });
  }
};

// ✅ NEW: Set Video URL
const setVideoUrl = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { url, title } = req.body;
    const userId = req.user.id;

    const room = await Room.findOne({
  $or: [
    { roomCode: roomId },
    { _id: roomId }
  ]
});

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if user is host
    if (room.host.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only host can set video' });
    }

    // Determine video type and extract info
    let videoData = { setBy: userId, setAt: new Date(), title };
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      // YouTube URL
      const videoId = extractYouTubeId(url);
      if (!videoId) {
        return res.status(400).json({ success: false, message: 'Invalid YouTube URL' });
      }
      videoData.type = 'youtube';
      videoData.id = videoId;
      videoData.url = `https://www.youtube.com/watch?v=${videoId}`;
    } else {
      // Direct video URL
      videoData.type = 'direct';
      videoData.url = url;
    }

    room.currentVideo = videoData;
    await room.save();

    // Emit to all room members via socket
    if (req.io) {
      req.io.to(roomId).emit('video-changed', { video: videoData });
    }

    res.json({ success: true, video: videoData });
  } catch (error) {
    console.error('Set video URL error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ✅ NEW: Upload Video
const uploadVideo = async (req, res) => {
  try {
    console.log('📤 Upload video request received');
    console.log('🏠 Room ID/Code:', req.params.roomId);
    console.log('👤 User ID:', req.user.id);
    console.log('📁 File:', req.file?.originalname);

    const { roomId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
    }

    const room = await Room.findOne({
        $or:[ {roomCode: roomId },
           { _id: roomId }
        ]
        });
    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    // Check if user is host
    if (room.host.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Only host can upload video' });
    }

    const videoData = {
      type: 'upload',
      url: `/uploads/videos/${req.file.filename}`,
      title: req.file.originalname,
      setBy: userId,
      setAt: new Date()
    };

    room.currentVideo = videoData;
    await room.save();

    console.log('✅ Video uploaded and saved:', videoData);
    // Emit to all room members via socket
    if (req.io) {
      req.io.to(roomId).emit('video-changed', { video: videoData });
        console.log('📡 Socket event emitted to room:', roomId);
    }

    res.json({ 
      success: true, 
      video: videoData,
      url: videoData.url,
      filename: req.file.originalname,
      size: req.file.size,
      message: 'Video uploaded successfully'
    });

  } catch (error) {
    console.error('❌ Upload video error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
};

// ✅ NEW: Helper function to extract YouTube video ID
const extractYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// ✅ UPDATED: Export all functions
module.exports = {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomDetails,
  getUserRooms,
  updateRoomSettings,
  setVideoUrl,        // ← New
  uploadVideo         // ← New
};
