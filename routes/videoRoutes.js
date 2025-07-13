// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const auth = require('../middleware/auth');

// const router = express.Router();

// // ✅ Multer setup
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
//     cb(null, uniqueName);
//   }
// });

// const upload = multer({ 
//   storage,
//   limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
//   fileFilter: (req, file, cb) => {
//     if (file.mimetype.startsWith('video/')) {
//       cb(null, true);
//     } else {
//       cb(new Error('Only video files allowed!'));
//     }
//   }
// });

// // ✅ Upload endpoint
// router.post('/upload', auth, upload.single('video'), (req, res) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: 'No video file uploaded' });
//     }

//     const videoUrl = `/uploads/${req.file.filename}`;
    
//     console.log('✅ Video uploaded successfully:', {
//       filename: req.file.filename,
//       url: videoUrl,
//       size: req.file.size
//     });

//     res.json({
//       success: true,
//       message: 'Video uploaded successfully',
//       video: {
//         url: videoUrl,
//         filename: req.file.filename,
//         originalName: req.file.originalname,
//         size: req.file.size,
//         title: req.file.originalname
//       }
//     });

//   } catch (error) {
//     console.error('❌ Video upload error:', error);
//     res.status(500).json({ message: 'Video upload failed' });
//   }
// });

// module.exports = router;
const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); // Your multer config
const auth = require('../middleware/auth'); // Your auth middleware
const path = require('path');

// ✅ FIXED: Video upload route
router.post('/upload', auth, upload.single('video'), async (req, res) => {
  try {
    console.log('📁 File upload request received');
    console.log('👤 User:', req.user);
    console.log('📄 File:', req.file);
    console.log('🏠 Room ID:', req.body.roomId);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file uploaded'
      });
    }

    if (!req.body.roomId) {
      return res.status(400).json({
        success: false,
        message: 'Room ID is required'
      });
    }

    // ✅ Create video object
    const video = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      title: req.file.originalname.split('.')[0],
      url: `/uploads/videos/${req.file.filename}`,
      size: req.file.size,
      mimetype: req.file.mimetype,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    console.log('✅ Video processed:', video);

    // ✅ Return success response
    res.json({
      success: true,
      message: 'Video uploaded successfully',
      video: video
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload video',
      error: error.message
    });
  }
});

module.exports = router;
