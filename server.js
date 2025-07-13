const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const chatRoutes = require('./routes/chatRoutes');
const videoRoutes = require('./routes/videoRoutes');

// Import from socketHandler (FIXED)
const { authenticateSocket, handleConnection } = require('./socket/socketHandlers');

const app = express();
const server = http.createServer(app);

// Enhanced Socket.IO setup
const io = socketIo(server, {
  cors: {
    // origin: process.env.CORS_ORIGIN || ["http://localhost:5174", "http://192.168.1.5:5174"],
    origin: '*',
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'] // Added polling fallback
});

// Connect to MongoDB
connectDB();

// --- MIDDLEWARE SETUP ---
// IMPORTANT: CORS must be the first middleware to run
app.use(cors({
  // origin: process.env.CORS_ORIGIN || ["http://localhost:5174", "http://192.168.1.5:5174"],
  origin: '*',
  credentials: true,

  // methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  methods: '*',
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files (e.g., uploaded videos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Security and Logging Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", "data:", "blob:"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws:", "wss:"] // Added WebSocket support
    }
  }
}));
app.use(morgan('combined'));

// Body Parsers for handling request bodies
app.use(express.json({ limit: '2gb' }));
app.use(express.urlencoded({ extended: true, limit: '2gb' }));

// Make io available in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Enhanced Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'SceneSync API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    socketConnections: io.engine.clientsCount || 0
  });
});

// Socket.IO status endpoint
app.get('/socket-status', (req, res) => {
  res.json({
    status: 'Socket.IO Active',
    connectedClients: io.engine.clientsCount || 0,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/videos', videoRoutes);

// Socket.IO Setup (CLEAN - No duplicate events)
io.use(authenticateSocket);
io.on('connection', handleConnection(io));

// Socket.IO Error Handling
io.engine.on('connection_error', (err) => {
  console.log('❌ Socket.IO connection error:', err.req);
  console.log('❌ Error code:', err.code);
  console.log('❌ Error message:', err.message);
  console.log('❌ Error context:', err.context);
});

// Enhanced global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate field value'
    });
  }

  // Handle Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      message: 'File too large. Maximum size is 100MB'
    });
  }

  if (err.message === 'Only video files allowed!') {
    return res.status(400).json({
      message: 'Only video files are allowed'
    });
  }
  
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'GET /socket-status',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/user/profile',
      'POST /api/rooms/create',
      'GET /api/rooms/:roomCode',
      'POST /api/videos/upload'
    ]
  });
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('🛑 Received shutdown signal, closing server gracefully...');
  
  // Close Socket.IO connections
  io.close(() => {
    console.log('✅ Socket.IO server closed');
  });
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
    process.exit(0);
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
  console.log('🚀 ================================');
  console.log(`🚀 SceneSync Server Started`);
  console.log(`🚀 Port: ${PORT}`);
  console.log(`🚀 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
  console.log(`🚀 Socket Status: http://localhost:${PORT}/socket-status`);
  console.log(`🚀 Static Files: ${path.join(__dirname, 'uploads')}`);
  console.log('🚀 ================================');
  console.log('🔌 Socket.IO server initialized');
  console.log('📁 File upload endpoint: /api/videos/upload');
  console.log('✅ Server ready to accept connections');
});

module.exports = { app, server, io };

