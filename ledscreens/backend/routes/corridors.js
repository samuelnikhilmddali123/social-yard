const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Corridor = require('../models/Corridor');
const {
  syncCorridorsFromScreens,
  validatePricePerScreen,
} = require('../utils/pricing');

const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied: Admin role required' });
  }
  next();
};

// @route   GET api/corridors/pricing
// @desc    Public pricing config for booking UI (single source of truth)
router.get('/pricing', async (req, res) => {
  try {
    await syncCorridorsFromScreens();
    const corridors = await Corridor.find({ isActive: { $ne: false } }).sort({ name: 1 });
    res.json(
      corridors.map((c) => ({
        corridorId: c._id.toString(),
        corridorName: c.name,
        pricePer5Sec: c.pricePer5Sec || Math.ceil((c.pricePer30Sec || c.pricePerScreen || 50) / 6),
        pricePer30Sec: c.pricePer30Sec || c.pricePerScreen || 50,
        pricePerScreen: c.pricePer5Sec || Math.ceil((c.pricePer30Sec || c.pricePerScreen || 50) / 6),
        city: c.city,
        area: c.area,
      }))
    );
  } catch (err) {
    console.error('Corridor pricing error:', err.message);
    res.status(500).json({ msg: 'Failed to load corridor pricing' });
  }
});

// @route   GET api/corridors
// @desc    Admin — full corridor list with stats
router.get('/', auth, adminOnly, async (req, res) => {
  try {
    await syncCorridorsFromScreens();
    const corridors = await Corridor.find().sort({ name: 1 }).lean();
    
    const Screen = require('../models/Screen');
    const result = [];
    for (const c of corridors) {
      const screens = await Screen.find({ corridorName: c.name }).lean();
      const uniquePoles = new Set(screens.map(s => s.poleId || s.deviceId.replace(/[AB]$/, '') || 'UNKN')).size;
      result.push({
        id: c._id,
        _id: c._id,
        corridorName: c.name,
        name: c.name,
        city: c.city,
        area: c.area,
        location: `${c.city}, ${c.area}`,
        totalPoles: uniquePoles,
        totalScreens: screens.length,
        pricePer5Sec: c.pricePer5Sec || Math.ceil((c.pricePer30Sec || c.pricePerScreen || 50) / 6),
        pricePer30Sec: c.pricePer30Sec || c.pricePerScreen || 50,
        pricePerScreen: c.pricePer5Sec || Math.ceil((c.pricePer30Sec || c.pricePerScreen || 50) / 6),
        isActive: c.isActive
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   GET api/corridors/:id/poles
// @desc    Admin — get poles/screens inside a specific corridor
router.get('/:id/poles', auth, adminOnly, async (req, res) => {
  try {
    const corridor = await Corridor.findById(req.params.id);
    if (!corridor) return res.status(404).json({ msg: 'Corridor not found' });
    
    const Screen = require('../models/Screen');
    const screens = await Screen.find({ corridorName: corridor.name }).lean();
    
    // Add runtime stream URL if active
    const streamManager = require('../utils/streamManager');
    const screensWithStream = screens.map(s => {
      try {
        return {
          ...s,
          liveStreamUrl: streamManager.getStreamUrl(s._id.toString())
        };
      } catch (streamErr) {
        return { ...s, liveStreamUrl: null };
      }
    });
    
    res.json(screensWithStream);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   PUT api/corridors/:id
// @desc    Admin — update corridor price (new bookings only)
router.put('/:id', auth, adminOnly, async (req, res) => {
  try {
    const { pricePer5Sec, pricePer30Sec, pricePerScreen, city, area, isActive } = req.body;
    const updates = {};

    const priceInput = pricePer5Sec !== undefined ? pricePer5Sec : (pricePer30Sec !== undefined ? pricePer30Sec : pricePerScreen);
    if (priceInput !== undefined) {
      const check = validatePricePerScreen(priceInput);
      if (!check.valid) return res.status(400).json({ msg: check.msg });
      
      if (pricePer5Sec !== undefined) {
        updates.pricePer5Sec = check.value;
        updates.pricePer30Sec = check.value * 6;
        updates.pricePerScreen = check.value;
      } else {
        updates.pricePer5Sec = Math.ceil(check.value / 6);
        updates.pricePer30Sec = check.value;
        updates.pricePerScreen = Math.ceil(check.value / 6);
      }
    }
    if (city !== undefined) updates.city = city;
    if (area !== undefined) updates.area = area;
    if (isActive !== undefined) updates.isActive = !!isActive;
    updates.updatedAt = new Date();

    const corridor = await Corridor.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!corridor) return res.status(404).json({ msg: 'Corridor not found' });
    res.json(corridor);
  } catch (err) {
    console.error('Update corridor error:', err.message);
    res.status(500).json({ msg: err.message || 'Update failed' });
  }
});

module.exports = router;
