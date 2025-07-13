// const mongoose = require('mongoose');
// const { v4: uuidv4 } = require('uuid');

// const roomSchema = new mongoose.Schema({
//   roomId: {
//     type: String,
//     unique: true,
//     default: () => uuidv4().substring(0, 8).toUpperCase()
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//     maxlength: 50
//   },
//   description: {
//     type: String,
//     maxlength: 200
//   },
//   host: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   participants: [{
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     joinedAt: {
//       type: Date,
//       default: Date.now
//     }
//   }],
//   maxParticipants: {
//     type: Number,
//     default: 10,
//     max: 10
//   },
//   currentVideo: {
//     url: String,
//     title: String,
//     platform: {
//       type: String,
//       enum: ['youtube', 'netflix', 'prime', 'other']
//     },
//     currentTime: {
//       type: Number,
//       default: 0
//     },
//     isPlaying: {
//       type: Boolean,
//       default: false
//     },
//     lastUpdated: {
//       type: Date,
//       default: Date.now
//     }
//   },
//   settings: {
//     hostOnlyControl: {
//       type: Boolean,
//       default: true
//     },
//     allowAnonymous: {
//       type: Boolean,
//       default: false
//     }
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   }
// }, {
//   timestamps: true
// });

// // Index for faster room lookups
// roomSchema.index({ roomId: 1 });
// roomSchema.index({ host: 1 });

// module.exports = mongoose.model('Room', roomSchema);
// const mongoose = require('mongoose');

// // Generate unique room code
// const generateRoomCode = () => {
//   return Math.random().toString(36).substring(2, 8).toUpperCase();
// };

// const roomSchema = new mongoose.Schema({
//   roomCode: {
//     type: String,
//     unique: true,  // ✅ This automatically creates index
//     default: generateRoomCode
//   },
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   description: {
//     type: String,
//     trim: true
//   },
//   host: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   participants: [{
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User'
//     },
//     joinedAt: {
//       type: Date,
//       default: Date.now
//     },
//     isActive: {
//       type: Boolean,
//       default: true
//     }
//   }],
//   currentVideo: {
//     url: String,
//     title: String,
//     duration: Number,
//     currentTime: {
//       type: Number,
//       default: 0
//     },
//     isPlaying: {
//       type: Boolean,
//       default: false
//     },
//     lastUpdated: {
//       type: Date,
//       default: Date.now
//     }
//   },
//   settings: {
//     isPublic: {
//       type: Boolean,
//       default: false
//     },
//     maxParticipants: {
//       type: Number,
//       default: 10
//     },
//     allowGuestUsers: {
//       type: Boolean,
//       default: true
//     },
//     chatEnabled: {
//       type: Boolean,
//       default: true
//     }
//   },
//   isActive: {
//     type: Boolean,
//     default: true
//   }
// }, {
//   timestamps: true
// });

// // Index for faster queries - Remove duplicate roomCode index
// // roomSchema.index({ roomCode: 1 }); // ❌ Remove this line - duplicate!
// roomSchema.index({ host: 1 });
// roomSchema.index({ isActive: 1 });

// // Pre-save middleware to ensure unique room code
// roomSchema.pre('save', async function(next) {
//   if (this.isNew && !this.roomCode) {
//     let code;
//     let exists = true;
    
//     while (exists) {
//       code = generateRoomCode();
//       const existingRoom = await this.constructor.findOne({ roomCode: code });
//       exists = !!existingRoom;
//     }
    
//     this.roomCode = code;
//   }
//   next();
// });

// // Methods
// roomSchema.methods.addParticipant = function(userId) {
//   const existingParticipant = this.participants.find(
//     p => p.user.toString() === userId.toString()
//   );
  
//   if (!existingParticipant) {
//     this.participants.push({ user: userId });
//   } else {
//     existingParticipant.isActive = true;
//     existingParticipant.joinedAt = new Date();
//   }
  
//   return this.save();
// };

// roomSchema.methods.removeParticipant = function(userId) {
//   const participant = this.participants.find(
//     p => p.user.toString() === userId.toString()
//   );
  
//   if (participant) {
//     participant.isActive = false;
//   }
  
//   return this.save();
// };

// roomSchema.methods.updateVideoState = function(videoState) {
//   this.currentVideo = {
//     ...this.currentVideo,
//     ...videoState,
//     lastUpdated: new Date()
//   };
  
//   return this.save();
// };

// // Static methods
// roomSchema.statics.findByCode = function(roomCode) {
//   return this.findOne({ roomCode, isActive: true })
//     .populate('host', 'username email')
//     .populate('participants.user', 'username email');
// };

// roomSchema.statics.findUserRooms = function(userId) {
//   return this.find({
//     $or: [
//       { host: userId },
//       { 'participants.user': userId, 'participants.isActive': true }
//     ],
//     isActive: true
//   })
//   .populate('host', 'username email')
//   .populate('participants.user', 'username email')
//   .sort({ updatedAt: -1 });
// };


// module.exports = mongoose.model('Room', roomSchema);
const mongoose = require('mongoose');

// Generate unique room code
const generateRoomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

const roomSchema = new mongoose.Schema({
  roomCode: {
    type: String,
    unique: true,  // ✅ This automatically creates index
    default: generateRoomCode
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  
  // ✅ UPDATED: Enhanced currentVideo schema
  currentVideo: {
    type: {
      type: String,
      enum: ['youtube', 'direct', 'upload']
    },
    url: String,
    id: String, // YouTube video ID
    title: String,
    duration: Number,
    currentTime: {
      type: Number,
      default: 0
    },
    isPlaying: {
      type: Boolean,
      default: false
    },
    setBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    setAt: {
      type: Date,
      default: Date.now
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  
  // ✅ UPDATED: Enhanced settings schema
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    maxParticipants: {
      type: Number,
      default: 10
    },
    allowGuestUsers: {
      type: Boolean,
      default: true
    },
    chatEnabled: {
      type: Boolean,
      default: true
    },
    hostOnlyControl: {  // ✅ NEW: Added missing field
      type: Boolean,
      default: true
    },
    allowAnonymous: {   // ✅ NEW: Added missing field
      type: Boolean,
      default: false
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries - Remove duplicate roomCode index
// roomSchema.index({ roomCode: 1 }); // ❌ Remove this line - duplicate!
roomSchema.index({ host: 1 });
roomSchema.index({ isActive: 1 });

// Pre-save middleware to ensure unique room code
roomSchema.pre('save', async function(next) {
  if (this.isNew && !this.roomCode) {
    let code;
    let exists = true;
        
    while (exists) {
      code = generateRoomCode();
      const existingRoom = await this.constructor.findOne({ roomCode: code });
      exists = !!existingRoom;
    }
        
    this.roomCode = code;
  }
  next();
});

// Methods
roomSchema.methods.addParticipant = function(userId) {
  const existingParticipant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
    
  if (!existingParticipant) {
    this.participants.push({ user: userId });
  } else {
    existingParticipant.isActive = true;
    existingParticipant.joinedAt = new Date();
  }
    
  return this.save();
};

roomSchema.methods.removeParticipant = function(userId) {
  const participant = this.participants.find(
    p => p.user.toString() === userId.toString()
  );
    
  if (participant) {
    participant.isActive = false;
  }
    
  return this.save();
};

// ✅ UPDATED: Enhanced updateVideoState method
roomSchema.methods.updateVideoState = function(videoState) {
  this.currentVideo = {
    ...this.currentVideo,
    ...videoState,
    lastUpdated: new Date()
  };
    
  return this.save();
};

// ✅ NEW: Set video method
roomSchema.methods.setVideo = function(videoData) {
  this.currentVideo = {
    ...videoData,
    setAt: new Date(),
    lastUpdated: new Date(),
    currentTime: 0,
    isPlaying: false
  };
  
  return this.save();
};

// Static methods
roomSchema.statics.findByCode = function(roomCode) {
  return this.findOne({ roomCode, isActive: true })
    .populate('host', 'username email')
    .populate('participants.user', 'username email')
    .populate('currentVideo.setBy', 'username email'); // ✅ NEW: Populate video setter
};

roomSchema.statics.findUserRooms = function(userId) {
  return this.find({
    $or: [
      { host: userId },
      { 'participants.user': userId, 'participants.isActive': true }
    ],
    isActive: true
  })
  .populate('host', 'username email')
  .populate('participants.user', 'username email')
  .populate('currentVideo.setBy', 'username email') // ✅ NEW: Populate video setter
  .sort({ updatedAt: -1 });
};

module.exports = mongoose.model('Room', roomSchema);
