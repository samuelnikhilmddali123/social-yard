const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PartnerRequest = require('../models/PartnerRequest');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getPresignedUrl } = require('../utils/s3');
const { sendTelegramNotification } = require('../utils/telegram');

const uploadDir = 'uploads/partners/';
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
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB max limit
});

// @route   POST api/partner-requests
// @desc    Submit a new partner onboarding request with optional files
router.post('/', upload.fields([
  { name: 'propertyPhotos', maxCount: 10 },
  { name: 'ownershipDoc', maxCount: 1 }
]), async (req, res) => {
  try {
    const { partnerType, name, phone, email, city, propertyType, poleCount, expectedRent, fullAddress, notes } = req.body;

    if (!partnerType || !name || !phone || !city) {
      return res.status(400).json({ msg: 'Partner type, name, phone, and city are required' });
    }

    const files = req.files || {};
    const propertyPhotos = (files.propertyPhotos || []).map(f => f.path.replace(/\\/g, '/'));
    const ownershipDoc = files.ownershipDoc?.[0]?.path.replace(/\\/g, '/') || '';

    const newRequest = new PartnerRequest({
      partnerType,
      name,
      phone,
      email,
      city,
      propertyType,
      poleCount: poleCount ? Number(poleCount) : undefined,
      expectedRent: expectedRent ? Number(expectedRent) : undefined,
      fullAddress,
      notes,
      propertyPhotos,
      ownershipDoc,
      status: 'pending'
    });

    const saved = await newRequest.save();

    const telegramMsg = `🤝 <b>NEW PARTNER REQUEST!</b>\n\n` +
      `👤 <b>Name:</b> ${saved.name}\n` +
      `📞 <b>Phone:</b> ${saved.phone}\n` +
      `📧 <b>Email:</b> ${saved.email || 'N/A'}\n` +
      `🌆 <b>City:</b> ${saved.city}\n` +
      `🏢 <b>Type:</b> ${saved.partnerType}\n` +
      `📍 <b>Address:</b> ${saved.fullAddress || 'N/A'}`;

    sendTelegramNotification(telegramMsg);

    const io = req.app.get('io');
    if (io) {
      io.emit('new-partner-request', {
        id: saved._id,
        name: saved.name,
        city: saved.city,
        partnerType: saved.partnerType
      });
    }

    res.status(201).json({ msg: 'Partner request submitted successfully', request: saved });
  } catch (err) {
    console.error('❌ Error creating partner request:', err.message);
    res.status(500).json({ msg: 'Server error creating partner request' });
  }
});

// @route   GET api/partner-requests
// @desc    Get all partner requests (Admin view)
router.get('/', auth, async (req, res) => {
  try {
    const requests = await PartnerRequest.find().sort({ createdAt: -1 });
    const formatted = await Promise.all(requests.map(async (r) => {
      const obj = r.toObject();
      obj.propertyPhotos = await Promise.all((r.propertyPhotos || []).map(p => getPresignedUrl(p)));
      if (r.ownershipDoc) {
        obj.ownershipDoc = await getPresignedUrl(r.ownershipDoc);
      }
      return obj;
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ msg: 'Server error fetching partner requests' });
  }
});

module.exports = router;
