const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Chat = require('../models/Chat');

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('🔍 Socket auth attempt:', {
      hasToken: !!token,
      userId: socket.handshake.auth.userId,
      username: socket.handshake.auth.username
    });

    if (!token) {
      console.error('❌ No token provided');
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔑 Token decoded:', decoded);
    
    // ✅ Try both _id and id fields
    const userId = decoded.userId || decoded.id || decoded._id;
    console.log('👤 Looking for user ID:', userId);
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.error('❌ User not found in database:', userId);
      return next(new Error('User not found'));
    }

    console.log('✅ User authenticated:', user.username);
    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    console.error('❌ Socket auth error:', error);
    next(new Error('Authentication error'));
  }
};

// Socket event handlers
const handleConnection = (io) => {
  return async (socket) => {
    console.log(`User ${socket.user.username} connected: ${socket.id}`);
    
    // Update user online status
    await User.findByIdAndUpdate(socket.userId, { 
      isOnline: true,
      lastSeen: new Date()
    });

    // Join Room
    socket.on('join-room', async (data) => {
      try {
        const { roomId } = data;
        
        // ✅ FIX: Find the room by its MongoDB _id, not the roomCode.
        const room = await Room.findById(roomId).populate('participants.user', 'username email');

        if (!room || !room.isActive) {
          socket.emit('error', { message: 'Room not found or is inactive' });
          return;
        }

        // Check if room is full
        if (room.participants.length >= room.maxParticipants) {
          socket.emit('room-full', { 
            message: 'Room is full. Maximum 10 users allowed per room.'
          });
          return;
        }

        // Check if user is participant
        const isParticipant = room.participants.some(
          participant => participant.user._id.toString() === socket.userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'You are not a participant in this room' });
          return;
        }

        // Join socket room
        socket.join(roomId);
        socket.currentRoom = roomId;

        // Notify others about user joining
        socket.to(roomId).emit('user-joined', {
          user: socket.user,
          message: `${socket.user.username} joined the room`
        });

        // Send current video state to new user
        if (room.currentVideo && room.currentVideo.url) {
          socket.emit('video-state-sync', {
            video: room.currentVideo,
            timestamp: Date.now()
          });
        }

        socket.emit('room-joined', { 
          room,
          message: 'Successfully joined the room'
        });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Error joining room' });
      }
    });

    // Leave Room
    socket.on('leave-room', async (data) => {
      try {
        const { roomId } = data;
        
        if (socket.currentRoom === roomId) {
          socket.leave(roomId);
          socket.currentRoom = null;
          
          // Notify others about user leaving
          socket.to(roomId).emit('user-left', {
            user: socket.user,
            message: `${socket.user.username} left the room`
          });
        }
      } catch (error) {
        console.error('Leave room error:', error);
      }
    });

    
    // ✅ Video Control Events - Simple Version
    socket.on('play-video', async (data) => {
      try {
        console.log('▶️ Play video request:', data);
         io.to(data.roomId).emit('video-play', {
      currentTime: data.currentTime,
      playedBy: socket.user.username
    });
    console.log('▶️ Video play broadcasted to room:', data.roomId);
  } catch (error) {
    console.error('❌ Play video error:', error);
  }
});


    socket.on('pause-video', async (data) => {
      try {
        console.log('⏸️ Pause video request:', data);
       io.to(data.roomId).emit('video-pause', {
      currentTime: data.currentTime,
      pausedBy: socket.user.username
    });
    console.log('⏸️ Video pause broadcasted to room:', data.roomId);
  } catch (error) {
    console.error('❌ Pause video error:', error);
  }
});

    socket.on('seek-video', async (data) => {
      try {
        console.log('⏭️ Seek video request:', data);
        io.to(data.roomId).emit('video-seek', {
      currentTime: data.currentTime,
      seekedBy: socket.user.username
    });
    console.log('⏭️ Video seek broadcasted to room:', data.roomId);
  } catch (error) {
    console.error('❌ Seek video error:', error);
  }
});

    // Video Changed Event (Database Update)
    socket.on('video-changed', async (data) => {
      try {
        const { roomId, video } = data;
        
        const room = await Room.findOne({ roomCode: roomId });
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is participant in room
        const isParticipant = room.participants.some(
          participant => participant.user.toString() === socket.userId
        );

        if (!isParticipant) {
          socket.emit('error', { message: 'You are not a participant in this room' });
          return;
        }

        // Update room video with uploaded video data
        room.currentVideo = {
          url: video.url,
          title: video.title || video.originalName || 'Uploaded Video',
          platform: video.filename ? 'upload' : 'external',
          filename: video.filename,
          currentTime: 0,
          isPlaying: false,
          lastUpdated: new Date()
        };
        
        await room.save();

        console.log('✅ Video changed in room:', {
          roomId,
          videoUrl: video.url,
          changedBy: socket.user.username
        });

        // Broadcast to all users in room
        io.to(roomId).emit('video-changed', {
          video: room.currentVideo,
          changedBy: socket.user.username,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('❌ Video change error:', error);
        socket.emit('error', { message: 'Failed to change video' });
      }
    });

    // Video State Sync Event
    socket.on('video-state-sync', async (data) => {
      try {
        const { roomId } = data;
        
        const room = await Room.findOne({ roomCode: roomId });
        if (!room) return;

        // Send current video state to requesting user
        socket.emit('video-state-sync', {
          video: room.currentVideo,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('❌ Video state sync error:', error);
      }
    });

    // Chat Events
    socket.on('send-message', async (data) => {
      try {
        const { roomId, message } = data;
        console.log(`💬 Message from ${socket.user.username} in room ${roomId}:`, message);

        const room = await Room.findById(roomId);
        if (!room) {
          return socket.emit('error', { message: 'Room not found' });
        }
        
        // Ensure the user is in the room before allowing them to send a message
        const isParticipant = room.participants.some(p => p.user.toString() === socket.userId);
        if (!isParticipant) {
          return socket.emit('error', { message: 'You are not a participant in this room.' });
        }

        const chatMessage = {
          text: message.text,
          type: message.type || 'text',
          user: {
            _id: socket.user._id,
            username: socket.user.username,
          },
          timestamp: new Date(),
        };

        // Optionally, save message to the database
        // This part is commented out, but you can enable it if you have a Chat model
        /*
        const savedMessage = await new Chat({
          room: roomId,
          user: socket.userId,
          message: message.text
        }).save();
        */

        // Broadcast the message to all users in the room
        io.to(roomId).emit('new-message', chatMessage);
        
        console.log(`✅ Message broadcasted to room ${roomId}`);

      } catch (error) {
        console.error('❌ Send message error:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    socket.on('typing-start', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user-typing', {
        user: socket.user.username,
        isTyping: true
      });
    });

    socket.on('typing-stop', (data) => {
      const { roomId } = data;
      socket.to(roomId).emit('user-typing', {
        user: socket.user.username,
        isTyping: false
      });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected: ${socket.id}`);
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.userId, { 
        isOnline: false,
        lastSeen: new Date()
      });

      // Notify room about user disconnect
      if (socket.currentRoom) {
        socket.to(socket.currentRoom).emit('user-disconnected', {
          user: socket.user,
          message: `${socket.user.username} disconnected`
        });
      }
    });
  };
};

module.exports = {
  authenticateSocket,
  handleConnection
};
