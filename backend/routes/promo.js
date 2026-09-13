const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PromoCode = require('../models/PromoCode');
const PromoUsage = require('../models/PromoUsage');
const User = require('../models/User');
const { ensureActivePromoCodes, getSettings, updateSettings, broadcastPromoUpdate } = require('../services/promoManager');

/**
 * @route   POST /api/promo/validate
 * @desc    Validate promo code for logged in user
 * @access  Private
 */
router.post('/validate', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return res.status(400).json({ valid: false, message: 'Please enter a promo code.' });
    }

    const cleanCode = code.trim().toUpperCase();

    // 1. Check if promo code exists
    const promo = await PromoCode.findOne({ code: cleanCode });
    if (!promo) {
      return res.status(404).json({ valid: false, message: 'Invalid promo code' });
    }

    // 2. Check if promo code is ACTIVE
    if (promo.status !== 'ACTIVE') {
      return res.status(400).json({ valid: false, message: 'Promo code has already been used' });
    }

    // 3. User Eligibility Check
    const settings = getSettings();
    if (settings.onePerUser) {
      const userId = req.user.id;
      const currentUser = await User.findById(userId);

      // Check if user ID or Phone has already redeemed a promo code
      const existingUsage = await PromoUsage.findOne({
        $or: [
          { userId: userId },
          ...(currentUser && currentUser.phone ? [{ phoneNumber: currentUser.phone }] : [])
        ]
      });

      if (existingUsage) {
        return res.status(400).json({
          valid: false,
          message: 'You have already redeemed your single-use free promo code.'
        });
      }
    }

    return res.json({
      valid: true,
      discountPercent: 100,
      code: promo.code,
      message: '100% Free Promo Code Applied! Total Payable is ₹0.'
    });
  } catch (err) {
    console.error('❌ Promo validation error:', err.message);
    return res.status(500).json({ valid: false, message: 'Failed to validate promo code.' });
  }
});

/**
 * @route   POST /api/promo/generate-social
 * @desc    Generate a Social Ads 100% Free Promo Code
 * @access  Private
 */
router.post('/generate-social', auth, async (req, res) => {
  try {
    const crypto = require('crypto');
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codeStr = 'SOCIAL';
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      codeStr += chars[bytes[i] % chars.length];
    }

    let exists = await PromoCode.findOne({ code: codeStr });
    while (exists) {
      codeStr = 'SOCIAL';
      const freshBytes = crypto.randomBytes(4);
      for (let i = 0; i < 4; i++) {
        codeStr += chars[freshBytes[i] % chars.length];
      }
      exists = await PromoCode.findOne({ code: codeStr });
    }

    const creatorUser = await User.findById(req.user.id);
    if (!creatorUser || (creatorUser.email !== 'social@e3di.org' && creatorUser.email !== 'socialads@e3di.org' && creatorUser.role !== 'admin')) {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Only Social Ads authorized account (social@e3di.org) can generate Social Ads promo codes.'
      });
    }

    const createdByName = creatorUser.name || creatorUser.email;
    const createdByEmail = creatorUser.email;

    const newPromo = await PromoCode.create({
      code: codeStr,
      status: 'ACTIVE',
      type: 'SOCIAL_ADS',
      createdByName,
      createdByEmail,
      createdById: req.user.id,
      createdAt: new Date()
    });

    const io = req.app.get('io');
    if (io) {
      await broadcastPromoUpdate(io);
    }

    return res.json({
      success: true,
      code: newPromo.code,
      message: `🎉 Social Ads Free Promo Code "${newPromo.code}" generated successfully!`
    });
  } catch (err) {
    console.error('❌ Social promo creation error:', err.message);
    return res.status(500).json({ success: false, message: 'Failed to generate Social Ads promo code.' });
  }
});

/**
 * @route   GET /api/promo/all
 * @desc    Get all promo codes (System Pool + Social Ads generated codes) and stats
 * @access  Private (Admin)
 */
router.get('/all', auth, async (req, res) => {
  try {
    const allCodes = await PromoCode.find().sort({ createdAt: -1 });
    const usage = await PromoUsage.find().sort({ usedAt: -1 });
    const activePool = await ensureActivePromoCodes(req.app.get('io'));

    const socialCodes = allCodes.filter(c => c.type === 'SOCIAL_ADS');
    const socialUsage = usage.filter(u => u.promoType === 'SOCIAL_ADS' || (u.promoCode && u.promoCode.startsWith('SOCIAL')));

    const totalSocialGenerated = socialCodes.length;
    const totalSocialActive = socialCodes.filter(c => c.status === 'ACTIVE').length;
    const totalSocialUsed = socialUsage.length;
    const totalSocialFreeValue = socialUsage.reduce((sum, u) => sum + (u.discountAmount || 0), 0);

    return res.json({
      success: true,
      allCodes,
      activePool,
      usage,
      socialStats: {
        totalSocialGenerated,
        totalSocialActive,
        totalSocialUsed,
        totalSocialFreeValue
      }
    });
  } catch (err) {
    console.error('❌ Error getting all promo codes:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/promo/active
 * @desc    Get currently 3 active promo codes (Admin)
 * @access  Private (Admin)
 */
router.get('/active', auth, async (req, res) => {
  try {
    const activeCodes = await ensureActivePromoCodes(req.app.get('io'));
    return res.json({ success: true, activeCodes });
  } catch (err) {
    console.error('❌ Get active promo codes error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/promo/usage
 * @desc    Get all promo code usage records (Admin)
 * @access  Private (Admin)
 */
router.get('/usage', auth, async (req, res) => {
  try {
    const usage = await PromoUsage.find().sort({ usedAt: -1 });
    return res.json({ success: true, usage });
  } catch (err) {
    console.error('❌ Get promo usage error:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * @route   GET /api/promo/settings
 * @desc    Get promo system configuration (Admin)
 * @access  Private (Admin)
 */
router.get('/settings', auth, async (req, res) => {
  return res.json({ success: true, settings: getSettings() });
});

/**
 * @route   PUT /api/promo/settings
 * @desc    Update promo system configuration (Admin)
 * @access  Private (Admin)
 */
router.put('/settings', auth, async (req, res) => {
  try {
    const newSettings = updateSettings(req.body);
    const io = req.app.get('io');
    if (io) broadcastPromoUpdate(io);
    return res.json({ success: true, settings: newSettings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
