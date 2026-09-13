const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { serializeUser, validateIndianPhone } = require('../utils/userSerialize');

function signTokenAndRespond(user, res) {
  const payload = { user: { id: user.id, role: user.role } };
  jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
    if (err) throw err;
    res.json({ token, user: serializeUser(user) });
  });
}
const multer = require('multer');
const path = require('path');

const crypto = require('crypto');

function base32Decode(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (let i = 0; i < base32.length; i++) {
    const val = alphabet.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  return Buffer.from(bytes);
}

const authenticator = {
  generateSecret: () => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let secret = '';
    const bytes = crypto.randomBytes(32);
    for (let i = 0; i < 32; i++) {
      secret += alphabet.charAt(bytes[i] % alphabet.length);
    }
    return secret;
  },
  keyuri: (account, issuer, secret) => {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;
  },
  verify: ({ token, secret }) => {
    try {
      if (!token || !secret) return false;
      const cleanToken = String(token).trim();
      const key = base32Decode(secret);
      const epoch = Math.floor(Date.now() / 1000);
      const currentCounter = Math.floor(epoch / 30);

      // Check current time step and +/- 1 step for clock drift
      for (let i = -1; i <= 1; i++) {
        const time = currentCounter + i;
        const buffer = Buffer.alloc(8);
        buffer.writeBigInt64BE(BigInt(time), 0);

        const hmac = crypto.createHmac('sha1', key);
        hmac.update(buffer);
        const digest = hmac.digest();

        const offset = digest[digest.length - 1] & 0xf;
        const codeNum = ((digest[offset] & 0x7f) << 24) |
                        ((digest[offset + 1] & 0xff) << 16) |
                        ((digest[offset + 2] & 0xff) << 8) |
                        (digest[offset + 3] & 0xff);

        const calculatedCode = (codeNum % 1000000).toString().padStart(6, '0');
        if (calculatedCode === cleanToken) return true;
      }
      return false;
    } catch (e) {
      console.error('❌ TOTP Verify Error:', e.message);
      return false;
    }
  }
};


// @route   POST api/auth/register
// @desc    Register user
router.post('/register', async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('❌ Register Error: req.body is missing or empty');
      return res.status(400).json({ msg: 'Request body is missing or empty' });
    }
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    user = new User({
      name,
      email,
      password,
      authProvider: 'local',
      profileCompleted: true,
    });
    await user.save();

    signTokenAndRespond(user, res);
  } catch (err) {
    console.error('❌ Register Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route   GET api/auth/login
// @desc    Verify endpoint is active
router.get('/login', (req, res) => {
  res.json({ 
    status: 'Active', 
    version: 'v2.8-Strict-Live',
    libLoaded: !!authenticator && authenticator.generateSecret() !== 'ERROR_LOADING_LIBRARY',
    message: 'Check libLoaded status to confirm if security tools are active.' 
  });
});

// @route   POST api/auth/google-login
// @desc    Sync Google/Firebase user and get token
router.post('/google-login', async (req, res) => {
  try {
    const { email, name, googleId } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email is required' });

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = new User({
        name,
        email: email.toLowerCase(),
        googleId,
        password: await bcrypt.hash(Math.random().toString(36), 10),
        role: 'user',
        authProvider: 'google',
        profileCompleted: false,
      });
      await user.save();
      console.log('👤 Created new Google user:', email);
    } else {
      if (!user.googleId) {
        user.googleId = googleId;
        if (!user.authProvider || user.authProvider === 'local') {
          user.authProvider = 'google';
        }
      }
      await user.save();
    }

    signTokenAndRespond(user, res);
  } catch (err) {
    console.error('❌ Google Login Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  try {
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('❌ Login Error: req.body is missing or empty');
      return res.status(400).json({ msg: 'Request body is missing or empty' });
    }
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const emailLower = email.toLowerCase();
    let user = await User.findOne({ email: emailLower });
    if (!user) {
      console.log('⚠️ User not found:', emailLower);
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('⚠️ Password mismatch for:', emailLower);
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    console.log(`🔐 User found: ${emailLower}, 2FA Enabled: ${user.twoFactorEnabled}, Secret Exists: ${!!user.twoFactorSecret}`);

    if (user.twoFactorEnabled) {
      console.log('🛡️ 2FA Required for:', emailLower);
      return res.json({ 
        require2FA: true, 
        userId: user.id,
        email: user.email 
      });
    }

    console.log('🔓 2FA Not Required. Signing JWT.');
    signTokenAndRespond(user, res);
  } catch (err) {
    console.error('❌ Login Error:', err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});


// @route   GET api/auth/setup-2fa
// @desc    Generate 2FA secret and QR code URL
router.get('/setup-2fa', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    const secret = authenticator.generateSecret();
    const userEmail = user.email || `user_${user._id}@e3di.org`;
    const otpauth = authenticator.keyuri(userEmail, 'JaanEntertainment', secret);
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(otpauth)}`;
    
    // Store secret atomically without running full document save validations
    await User.findByIdAndUpdate(req.user.id, { $set: { twoFactorSecret: secret } });

    res.json({ secret, otpauth, qrCodeUrl });
  } catch (err) {
    console.error('❌ Setup 2FA Error:', err);
    res.status(500).json({ error: 'Setup failed', details: err.message || 'Server error during 2FA initialization' });
  }
});

// @route   POST api/auth/confirm-2fa
// @desc    Verify and enable 2FA
router.post('/confirm-2fa', auth, async (req, res) => {
  const { code, disable } = req.body || {};
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (disable) {
       await User.findByIdAndUpdate(req.user.id, { $set: { twoFactorEnabled: false } });
       return res.json({ success: true, msg: '2FA disabled successfully' });
    }

    if (!user.twoFactorSecret) return res.status(400).json({ msg: '2FA Setup not initiated' });

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    if (!isValid) return res.status(400).json({ msg: 'Invalid verification code. Please check Google Authenticator app.' });

    await User.findByIdAndUpdate(req.user.id, { $set: { twoFactorEnabled: true } });

    res.json({ success: true, msg: '2FA enabled successfully' });
  } catch (err) {
    console.error('❌ Confirm 2FA Error:', err);
    res.status(500).json({ error: 'Confirmation failed', details: err.message });
  }
});

// @route   POST api/auth/verify-2fa
// @desc    Verify 2FA code and get token (during login)
router.post('/verify-2fa', async (req, res) => {
  try {
    if (!req.body) return res.status(400).json({ msg: 'Request body is missing' });
    const { userId, code } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
       return res.status(400).json({ msg: '2FA not enabled for this user' });
    }

    if (!user.twoFactorSecret || user.twoFactorSecret.length < 5) {
       console.log('❌ 2FA verification failed: Secret is missing or too short');
       return res.status(400).json({ msg: 'Security setup incomplete. Please contact support.' });
    }

    const isValid = authenticator.verify({ token: code, secret: user.twoFactorSecret });
    console.log(`🔐 2FA Verification for ${user.email}: Code ${code}, Result: ${isValid}`);
    
    if (isValid === true) {
      signTokenAndRespond(user, res);
    } else {
      console.log('🚫 2FA Code REJECTED');
      res.status(400).json({ msg: 'Invalid verification code' });
    }
  } catch (err) {
    console.error('2FA Verification Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


// Multer storage for profile pics
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `profile-${req.user.id}${path.extname(file.originalname)}`)
});
const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @route   POST api/auth/profile-pic
// @desc    Upload profile picture
router.post('/profile-pic', auth, upload.single('image'), async (req, res) => {
  try {
    const imageUrl = `/uploads/${req.file.filename}`;
    await User.findByIdAndUpdate(req.user.id, { profilePic: imageUrl });
    res.json({ imageUrl });
  } catch (err) {
    res.status(500).json({ error: 'Upload failed' });
  }
});

// @route   GET api/auth/me
// @desc    Current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    // Self-heal: If hasUsedFreeTrial is false/unset but they already have bookings in DB
    if (!user.hasUsedFreeTrial) {
      const Schedule = require('../models/Schedule');
      const bookingCount = await Schedule.countDocuments({ userId: user._id });
      if (bookingCount > 0) {
        user.hasUsedFreeTrial = true;
        await user.save();
        console.log(`🧼 Self-healed user hasUsedFreeTrial for ${user.email} (has ${bookingCount} bookings)`);
      }
    }

    res.json({ user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/complete-profile
// @desc    Complete profile after Google sign-in (name + phone required)
router.post('/complete-profile', auth, async (req, res) => {
  try {
    const { name, phone, companyName, gst, businessType } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!name?.trim()) {
      return res.status(400).json({ msg: 'Full name is required.' });
    }

    const phoneCheck = validateIndianPhone(phone);
    if (!phoneCheck.valid) {
      return res.status(400).json({ msg: phoneCheck.msg });
    }

    user.name = name.trim();
    user.phone = phoneCheck.value;
    if (companyName !== undefined) user.companyName = String(companyName).trim();
    if (gst !== undefined) user.gst = String(gst).trim();
    if (businessType !== undefined) user.businessType = String(businessType).trim();
    user.profileCompleted = true;

    await user.save();
    res.json({ msg: 'Profile completed', user: serializeUser(user) });
  } catch (err) {
    console.error('Complete profile error:', err.message);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update user profile & password
router.put('/profile', auth, async (req, res) => {
  const { name, email, phone, twoFactorEnabled, currentPassword, newPassword } = req.body;
  try {
    let user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ msg: 'Email already in use' });
      user.email = email;
    }

    if (name) user.name = name;
    if (phone !== undefined) {
      const phoneCheck = validateIndianPhone(phone);
      if (!phoneCheck.valid) return res.status(400).json({ msg: phoneCheck.msg });
      user.phone = phoneCheck.value;
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ msg: 'Current password required' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ msg: 'Current password incorrect' });
      user.password = newPassword;
    }

    if (user.name?.trim() && user.phone?.trim()) {
      user.profileCompleted = true;
    }

    await user.save();
    res.json({ msg: 'Profile updated', user: serializeUser(user) });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// @route   POST api/auth/save-fcm-token
// @desc    Register a new Firebase Cloud Messaging token for the current user
router.post('/save-fcm-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ msg: 'Token is required' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });

    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    res.json({ msg: 'FCM Token saved successfully' });
  } catch (err) {
    console.error('❌ Save FCM Token error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
