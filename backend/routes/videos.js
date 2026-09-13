const express = require('express');
const videoRouter = express.Router();
const auth = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const Video = require('../models/Video');
const { getPresignedUrl } = require('../utils/s3');

// @route   POST api/videos/presigned-url
// @desc    Generate a presigned upload URL for direct upload (disabled: fallback to disk)
videoRouter.post('/presigned-url', [auth], async (req, res) => {
  return res.json({ useS3: false });
});

// @route   POST api/videos/save-metadata
// @desc    Save video metadata after upload
videoRouter.post('/save-metadata', [auth], async (req, res) => {
  const { title, filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ msg: 'filePath is required' });
  }

  try {
    const newVideo = new Video({
      title: title || 'Untitled',
      filePath: filePath,
      uploadedBy: req.user.id
    });
    const video = await newVideo.save();

    const signedUrl = await getPresignedUrl(video.filePath);
    const videoObj = video.toObject({ virtuals: true });
    videoObj.url = signedUrl;

    res.json(videoObj);

    const io = req.app.get('io');
    if (io) {
      io.emit('new-upload', {
        title: video.title,
        user: req.user.name || 'A user',
        id: video._id
      });
    }
  } catch (err) {
    console.error('❌ Database Save Error:', err.message);
    res.status(500).send('Server error');
  }
});

const uploadDir = 'uploads/creative/';
if (!process.env.VERCEL && !fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const sanitizeFileName = (name) => {
  const ext = path.extname(name);
  const base = path.basename(name, ext).replace(/[^a-z0-9]/gi, '_').substring(0, 50);
  return `${Date.now()}_${base}${ext.toLowerCase()}`;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, sanitizeFileName(file.originalname))
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max limit
}).fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 }
]);

// @route   POST api/videos/upload
// @desc    Upload a creative (video or image) to CPU server disk
videoRouter.post('/upload', [auth], (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.error('❌ Multer Error:', err);
      return res.status(400).json({ msg: err.message || 'File upload error' });
    }

    try {
      const files = req.files;
      const file = files && (files.video?.[0] || files.thumbnail?.[0]);

      if (!file) {
        return res.status(400).json({ msg: 'Please upload a video or image file' });
      }

      const relPath = file.path.replace(/\\/g, '/');
      const isVideo = file.mimetype.startsWith('video/');

      let thumbRelPath = '';
      if (files.thumbnail?.[0]) {
        thumbRelPath = files.thumbnail[0].path.replace(/\\/g, '/');
      }

      const newVideo = new Video({
        title: req.body.title || file.originalname,
        filePath: relPath,
        thumbnailPath: thumbRelPath,
        mediaType: isVideo ? 'video' : 'image',
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedBy: req.user.id
      });

      const savedVideo = await newVideo.save();
      const videoObj = savedVideo.toObject({ virtuals: true });
      videoObj.url = await getPresignedUrl(savedVideo.filePath);

      if (thumbRelPath) {
        videoObj.thumbnailUrl = await getPresignedUrl(savedVideo.thumbnailPath);
      }

      res.json(videoObj);

      const io = req.app.get('io');
      if (io) {
        io.emit('new-upload', {
          title: savedVideo.title,
          user: req.user.name || 'A user',
          id: savedVideo._id
        });
      }
    } catch (dbErr) {
      console.error('❌ Upload DB Error:', dbErr);
      res.status(500).send('Server error saving upload details');
    }
  });
});

// @route   GET api/videos
videoRouter.get('/', auth, async (req, res) => {
  try {
    const videos = await Video.find({ uploadedBy: req.user.id }).sort({ createdAt: -1 });
    const videosWithUrls = await Promise.all(videos.map(async (v) => {
      const obj = v.toObject({ virtuals: true });
      obj.url = await getPresignedUrl(v.filePath);
      if (v.thumbnailPath) {
        obj.thumbnailUrl = await getPresignedUrl(v.thumbnailPath);
      }
      return obj;
    }));
    res.json(videosWithUrls);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

module.exports = videoRouter;
