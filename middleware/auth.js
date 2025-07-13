// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const auth = async (req, res, next) => {
//   try {
//     const token = req.header('Authorization')?.replace('Bearer ', '');
    
//     if (!token) {
//       return res.status(401).json({ message: 'No token, authorization denied' });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.userId).select('-password');
    
//     if (!user) {
//       return res.status(401).json({ message: 'Token is not valid' });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     console.error('Auth middleware error:', error);
//     res.status(401).json({ message: 'Token is not valid' });
//   }
// };

// module.exports = auth;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ HTTP Route Protection
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// ✅ Socket.IO Authentication
const authenticateSocket = async (socket, next) => {
  try {
    console.log('🔐 Authenticating socket connection...');
    
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('❌ No token provided in socket handshake');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      console.log('❌ User not found');
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.username = user.username;
    socket.userEmail = user.email;

    console.log(`✅ Socket authenticated for user: ${user.username}`);
    next();
    
  } catch (error) {
    console.error('❌ Socket authentication error:', error.message);
    next(new Error(`Authentication error: ${error.message}`));
  }
};

// ✅ MAIN EXPORT - Default export
module.exports = auth;

// ✅ Named exports
module.exports.auth = auth;
module.exports.protect = auth;
module.exports.authenticateSocket = authenticateSocket;
