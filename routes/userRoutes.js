const express = require('express');
// Fix: Use same import as authRoutes
const auth = require('../middleware/auth');  // ← Not { authenticateToken }
const router = express.Router();

router.get('/stats', auth, async (req, res) => {  // ← Use 'auth' not 'authenticateToken'
  try {
    const stats = {
      totalRooms: 0,
      activeRooms: 0,
      totalParticipants: 0,
      hoursWatched: 0
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

