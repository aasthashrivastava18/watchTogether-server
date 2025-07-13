// const express = require('express');
// const { body } = require('express-validator');
// const {
//   register,
//   login,
//   getMe,
//   logout
// } = require('../controllers/authController');
// const auth = require('../middleware/auth');

// const router = express.Router();

// // Register route with validation
// router.post('/register', [
//   body('username')
//     .trim()
//     .isLength({ min: 3, max: 20 })
//     .withMessage('Username must be between 3 and 20 characters')
//     .matches(/^[a-zA-Z0-9_]+$/)
//     .withMessage('Username can only contain letters, numbers, and underscores'),
//   body('email')
//     .isEmail()
//     .normalizeEmail()
//     .withMessage('Please provide a valid email'),
//   body('password')
//     .isLength({ min: 6 })
//     .withMessage('Password must be at least 6 characters long')
// ], register);

// // Login route with validation
// router.post('/login', [
//   body('email')
//     .isEmail()
//     .normalizeEmail()
//     .withMessage('Please provide a valid email'),
//   body('password')
//     .notEmpty()
//     .withMessage('Password is required')
// ], login);

// // Get current user (protected route)
// router.get('/me', auth, getMe);

// // Logout (protected route)
// router.post('/logout', auth, logout);

// module.exports = router;
const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  logout
} = require('../controllers/authController');

// ✅ Import auth middleware (default import)
const auth = require('../middleware/auth');

const router = express.Router();

// Register route
router.post('/register', [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
], register);

// Login route
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
], login);

// ✅ Get current user (Line 42 - FIX)
router.get('/me', auth, getMe);

// ✅ Logout route
router.post('/logout', auth, logout);

module.exports = router;
