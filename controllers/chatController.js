// const Chat = require('../models/Chat');
// const Room = require('../models/Room');
// const { validationResult } = require('express-validator');

// // Send Message
// const sendMessage = async (req, res) => {
//   try {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     const { roomId, message, messageType = 'text' } = req.body;
//     const userId = req.user.id;

//     // Check if room exists and user is participant
//     const room = await Room.findOne({ roomId, isActive: true });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     const isParticipant = room.participants.some(
//       participant => participant.user.toString() === userId
//     );

//     if (!isParticipant) {
//       return res.status(403).json({ message: 'You are not a participant in this room' });
//     }

//     // Create new chat message
//     const chat = new Chat({
//       room: room._id,
//       sender: userId,
//       message,
//       messageType
//     });

//     await chat.save();
//     await chat.populate('sender', 'username email');

//     res.status(201).json({
//       message: 'Message sent successfully',
//       chat
//     });
//   } catch (error) {
//     console.error('Send message error:', error);
//     res.status(500).json({ message: 'Server error while sending message' });
//   }
// };

// // Get Room Chat History
// const getRoomChatHistory = async (req, res) => {
//   try {
//     const { roomId } = req.params;
//     const { page = 1, limit = 50 } = req.query;
//     const userId = req.user.id;

//     // Check if room exists and user is participant
//     const room = await Room.findOne({ roomId, isActive: true });
//     if (!room) {
//       return res.status(404).json({ message: 'Room not found' });
//     }

//     const isParticipant = room.participants.some(
//       participant => participant.user.toString() === userId
//     );

//     if (!isParticipant) {
//       return res.status(403).json({ message: 'You are not a participant in this room' });
//     }

//     // Get chat messages with pagination
//     const chats = await Chat.find({ room: room._id })
//       .populate('sender', 'username email')
//       .populate('reactions.user', 'username')
//       .sort({ createdAt: -1 })
//       .limit(limit * 1)
//       .skip((page - 1) * limit);

//     const totalMessages = await Chat.countDocuments({ room: room._id });

//     res.json({
//       chats: chats.reverse(), // Reverse to show oldest first
//       pagination: {
//         currentPage: page,
//         totalPages: Math.ceil(totalMessages / limit),
//         totalMessages,
//         hasMore: page * limit < totalMessages
//       }
//     });
//   } catch (error) {
//     console.error('Get chat history error:', error);
//     res.status(500).json({ message: 'Server error while fetching chat history' });
//   }
// };

// // Add Reaction to Message
// const addReaction = async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const { emoji } = req.body;
//     const userId = req.user.id;

//     const chat = await Chat.findById(chatId).populate('room');
//     if (!chat) {
//       return res.status(404).json({ message: 'Message not found' });
//     }

//     // Check if user is participant in the room
//     const room = await Room.findById(chat.room._id);
//     const isParticipant = room.participants.some(
//       participant => participant.user.toString() === userId
//     );

//     if (!isParticipant) {
//       return res.status(403).json({ message: 'You are not a participant in this room' });
//     }

//     // Check if user already reacted with this emoji
//     const existingReaction = chat.reactions.find(
//       reaction => reaction.user.toString() === userId && reaction.emoji === emoji
//     );

//     if (existingReaction) {
//       // Remove existing reaction
//       chat.reactions = chat.reactions.filter(
//         reaction => !(reaction.user.toString() === userId && reaction.emoji === emoji)
//       );
//     } else {
//       // Add new reaction
//       chat.reactions.push({
//         user: userId,
//         emoji,
//         createdAt: new Date()
//       });
//     }

//     await chat.save();
//     await chat.populate('reactions.user', 'username');

//     res.json({
//       message: 'Reaction updated successfully',
//       chat
//     });
//   } catch (error) {
//     console.error('Add reaction error:', error);
//     res.status(500).json({ message: 'Server error while adding reaction' });
//   }
// };

// // Delete Message (only sender or room host)
// const deleteMessage = async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const userId = req.user.id;

//     const chat = await Chat.findById(chatId).populate('room');
//     if (!chat) {
//       return res.status(404).json({ message: 'Message not found' });
//     }

//     const room = await Room.findById(chat.room._id);

//     // Only sender or room host can delete message
//     if (chat.sender.toString() !== userId && room.host.toString() !== userId) {
//       return res.status(403).json({ message: 'You can only delete your own messages' });
//     }

//     await Chat.findByIdAndDelete(chatId);

//     res.json({ message: 'Message deleted successfully' });
//   } catch (error) {
//     console.error('Delete message error:', error);
//     res.status(500).json({ message: 'Server error while deleting message' });
//   }
// };

// module.exports = {
//   sendMessage,
//   getRoomChatHistory,
//   addReaction,
//   deleteMessage
// };
const Message = require('../models/Message');
const Room = require('../models/Room');

// @desc    Get messages for a room with pagination
// @route   GET /api/chat/:roomId/history
// @access  Private
const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Check if user is member of the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ room: roomId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Message.countDocuments({ room: roomId });

    res.json({
      messages: messages.reverse(),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get recent messages for a room
// @route   GET /api/chat/:roomId
// @access  Private
const getRoomChatHistory = async (req, res) => {  // ✅ Name changed to match import
  try {
    const { roomId } = req.params;
    
    // Check if user is member of the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ room: roomId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();

    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Send message to room
// @route   POST /api/chat
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { roomId, text, type = 'text' } = req.body;  // ✅ roomId from body instead of params
    
    // Check if user is member of the room
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const message = new Message({
      text,
      type,
      user: req.user.id,
      room: roomId
    });

    await message.save();
    await message.populate('user', 'username email');

    res.status(201).json({ message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add reaction to message
// @route   POST /api/chat/:chatId/reaction
// @access  Private
const addReaction = async (req, res) => {  // ✅ Added missing function
  try {
    const { chatId } = req.params;
    const { emoji } = req.body;

    const message = await Message.findById(chatId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is member of the room
    const room = await Room.findById(message.room);
    if (!room.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Add or update reaction
    const existingReaction = message.reactions.find(
      r => r.user.toString() === req.user.id
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      message.reactions.push({
        user: req.user.id,
        emoji
      });
    }

    await message.save();
    await message.populate('user', 'username email');

    res.json({ message });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete a message
// @route   DELETE /api/chat/:chatId
// @access  Private
const deleteMessage = async (req, res) => {
  try {
    const { chatId } = req.params;  // ✅ Changed from messageId to chatId
    
    const message = await Message.findById(chatId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only message owner or room admin can delete
    if (message.user.toString() !== req.user.id) {
      const room = await Room.findById(message.room);
      if (room.host.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    await Message.findByIdAndDelete(chatId);
    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMessages,
  getRoomChatHistory,  // ✅ Correct name
  sendMessage,
  addReaction,         // ✅ Added missing function
  deleteMessage
};


