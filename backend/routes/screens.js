const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Screen = require('../models/Screen');
const streamManager = require('../utils/streamManager');
const jwt = require('jsonwebtoken');

const fallbackScreens = [
  {
    _id: '65f800000000000000000075',
    deviceId: 'ethree-75',
    name: 'eThree 75" Grand Display',
    location: 'eThree Portal — Vijayawada',
    corridorName: 'ETHREE PORTAL',
    city: 'Vijayawada',
    area: 'eThree',
    poleId: 'ETHREE-P75',
    side: 'A',
    status: 'online',
    lat: 16.5062,
    lng: 80.6480
  },
  {
    _id: '65f800000000000000000001',
    deviceId: 'ethree-65',
    name: 'eThree 65" Display',
    location: 'eThree Portal — Vijayawada',
    corridorName: 'ETHREE PORTAL',
    city: 'Vijayawada',
    area: 'eThree',
    poleId: 'ETHREE-P01',
    side: 'A',
    status: 'online',
    lat: 16.5062,
    lng: 80.6480
  },
  {
    _id: '65f800000000000000000002',
    deviceId: 'ethree-pole1',
    name: 'Pole 1 (5x3 Screen)',
    location: 'Pole 1 — Vijayawada',
    corridorName: 'ETHREE PORTAL',
    city: 'Vijayawada',
    area: 'Pole 1',
    poleId: 'ETHREE-POLE1',
    side: 'A',
    status: 'online',
    lat: 16.5062,
    lng: 80.6480
  },
  {
    _id: '65f800000000000000000003',
    deviceId: 'ethree-pole2',
    name: 'Pole 2 (5x3 Screen)',
    location: 'Pole 2 — Vijayawada',
    corridorName: 'ETHREE PORTAL',
    city: 'Vijayawada',
    area: 'Pole 2',
    poleId: 'ETHREE-POLE2',
    side: 'B',
    status: 'online',
    lat: 16.5062,
    lng: 80.6480
  },
  {
    _id: '65f800000000000000000099',
    deviceId: 'ethree-landscape',
    name: 'Social Ads 16:9 Landscape Screen',
    location: 'eThree Social Hub — Vijayawada',
    corridorName: 'Social Ads Widescreen',
    city: 'Vijayawada',
    area: 'Social Ads',
    poleId: 'ETHREE-SOC1',
    side: 'A',
    status: 'online',
    orientation: 'landscape',
    format: 'social-landscape',
    lat: 16.5062,
    lng: 80.6480
  }
];

// @route   GET api/screens
// @desc    Get all screens
router.get('/', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (mongoose.connection.readyState !== 1) {
    console.warn('⚠️ DB not connected for GET /api/screens. Returning fallback screens.');
    return res.json(fallbackScreens);
  }

  try {
    const screensPromise = Screen.find({}).lean();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Mongoose query timeout')), 2000)
    );

    let screens = await Promise.race([screensPromise, timeoutPromise]);
    if (!screens || screens.length === 0) {
      screens = fallbackScreens;
    }
    
    const screensWithStream = screens.map(s => {
      try {
        return {
          ...s,
          liveStreamUrl: streamManager.getStreamUrl(s._id.toString()),
        };
      } catch (streamErr) {
        return { ...s, liveStreamUrl: null };
      }
    });
    
    return res.json(screensWithStream);
  } catch (err) {
    console.warn('⚠️ Error/Timeout fetching screens, returning fallback screens:', err.message);
    return res.json(fallbackScreens);
  }
});

router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  const { 
    name, location, deviceId, lat, lng,
    corridorName, city, area, poleId, poleType,
    side, facingLocation, orientation,
    resolution, width, height,
    deviceType, cameraStreamUrl, playbackUrl
  } = req.body;

  try {
    const existing = await Screen.findOne({ deviceId });
    if (existing) return res.status(400).json({ msg: 'Screen with this Device ID already exists' });
    
    const newScreen = new Screen({ 
      name, location, deviceId, lat, lng,
      corridorName, city, area, poleId, poleType,
      side, facingLocation, orientation,
      resolution, width, height,
      deviceType, cameraStreamUrl, playbackUrl,
      status: 'online', // Default to online for new provisions
      accessType: 'public'
    });
    
    const screen = await newScreen.save();
    res.json(screen);
  } catch (err) {
    console.error('Error in POST /screens:', err);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// @route   POST api/screens/pole
// @desc    Add a dual-sided pole (creates 2 screens)
router.post('/pole', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  const { 
    corridorName, poleId, city, area, poleType, lat, lng,
    sideA, sideB, device
  } = req.body;

  try {
    // Check if any device ID already exists
    const checkA = await Screen.findOne({ deviceId: sideA.deviceId });
    const checkB = await Screen.findOne({ deviceId: sideB.deviceId });
    if (checkA || checkB) return res.status(400).json({ msg: 'One of the Device IDs already exists' });

    const common = { corridorName, poleId, city, area, poleType, lat, lng, location: `${city}, ${area}` };

    const screenA = new Screen({
      ...common,
      name: `${poleId} - Side A`,
      deviceId: sideA.deviceId,
      side: 'A',
      facingLocation: sideA.facingLocation,
      orientation: sideA.orientation,
      resolution: sideA.resolution,
      width: sideA.width,
      height: sideA.height,
      status: sideA.status || 'online',
      deviceType: device.type,
      cameraStreamUrl: device.cameraUrl,
      playbackUrl: device.playbackUrl
    });

    const screenB = new Screen({
      ...common,
      name: `${poleId} - Side B`,
      deviceId: sideB.deviceId,
      side: 'B',
      facingLocation: sideB.facingLocation,
      orientation: sideB.orientation,
      resolution: sideB.resolution,
      width: sideB.width,
      height: sideB.height,
      status: sideB.status || 'online',
      deviceType: device.type,
      cameraStreamUrl: device.cameraUrl,
      playbackUrl: device.playbackUrl,
      oppositeScreenId: screenA._id
    });

    await screenA.save();
    screenA.oppositeScreenId = screenB._id;
    await screenA.save();
    await screenB.save();

    res.json({ msg: 'Pole created successfully', screens: [screenA, screenB] });
  } catch (err) {
    console.error('Error in POST /screens/pole:', err);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// @route   POST api/screens/corridor
// @desc    Bulk create an entire corridor
router.post('/corridor', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  const { corridorData, poles } = req.body;
  // corridorData: { name, city, area, sideAFacing, sideBFacing }
  // poles: [ { lat, lng, sideAEnabled, sideBEnabled, poleName, deviceIdPrefix } ]

  try {
    const createdScreens = [];
    
    for (const pole of poles) {
      const common = {
        corridorName: corridorData.name,
        city: corridorData.city,
        area: corridorData.area,
        lat: pole.lat,
        lng: pole.lng,
        location: `${corridorData.city}, ${corridorData.area}`,
        poleId: pole.poleName,
        poleType: 'Dual-Sided Divider Pole'
      };

      let sA = null;
      let sB = null;

      if (pole.sideAEnabled) {
        sA = new Screen({
          ...common,
          name: `${pole.poleName} - Side A`,
          deviceId: `${pole.deviceIdPrefix}A`,
          side: 'A',
          facingLocation: corridorData.sideAFacing,
          status: 'online'
        });
        await sA.save();
        createdScreens.push(sA);
      }

      if (pole.sideBEnabled) {
        sB = new Screen({
          ...common,
          name: `${pole.poleName} - Side B`,
          deviceId: `${pole.deviceIdPrefix}B`,
          side: 'B',
          facingLocation: corridorData.sideBFacing,
          status: 'online',
          oppositeScreenId: sA ? sA._id : null
        });
        await sB.save();
        if (sA) {
          sA.oppositeScreenId = sB._id;
          await sA.save();
        }
        createdScreens.push(sB);
      }
    }

    res.json({ msg: 'Corridor created successfully', count: createdScreens.length });
  } catch (err) {
    console.error('Error in POST /screens/corridor:', err);
    res.status(500).json({ msg: err.message || 'Server error' });
  }
});

// @route   PUT api/screens/:id
// @desc    Update screen
router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  try {
    const screen = await Screen.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    res.json(screen);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/screens/:id
// @desc    Delete screen
router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  try {
    await Screen.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Screen removed' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   POST api/screens/:id/start-stream
// @desc    Start IP camera stream
router.post('/:id/start-stream', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  try {
    const screen = await Screen.findById(req.params.id);
    if (!screen) return res.status(404).json({ msg: 'Screen not found' });
    if (!screen.cameraStreamUrl) return res.status(400).json({ msg: 'No camera stream configured for this screen' });

    const streamUrl = streamManager.startStream(screen._id.toString(), screen.cameraStreamUrl);
    res.json({ success: true, streamUrl });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to start stream', details: err.message });
  }
});

// @route   POST api/screens/:id/stop-stream
// @desc    Stop IP camera stream
router.post('/:id/stop-stream', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  try {
    streamManager.stopStream(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to stop stream' });
  }
});

// @route   DELETE api/screens/corridor/:name
// @desc    Clear all screens in a corridor from database
router.delete('/corridor/:name', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  try {
    const Screen = require('../models/Screen');
    await Screen.deleteMany({ corridorName: req.params.name });
    res.json({ msg: `All screens in corridor ${req.params.name} removed` });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to wipe corridor' });
  }
});

// @route   DELETE api/screens/wipe
// @desc    Clear all screens from database
router.delete('/wipe', auth, async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ msg: 'Not authorized' });
  try {
    await Screen.deleteMany({});
    res.json({ msg: 'All screens removed from database' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to wipe inventory' });
  }
});

router.post('/reset-seed', async (req, res) => {
  try {
    // Clear existing screens
    await Screen.deleteMany({});
    
    const startLat = 16.5055;
    const startLng = 80.6312;
    const latStep = -0.00008; 
    const lngStep = 0.00045;
    
    const defaultScreens = [];
    for (let i = 1; i <= 10; i++) {
      const poleId = `POLE-${String(i).padStart(3, '0')}`;
      const poleLat = startLat + ((i-1) * latStep);
      const poleLng = startLng + ((i-1) * lngStep);

      defaultScreens.push({
        name: `Pole ${i} - Front`,
        location: "Vijayawada MG Road Corridor",
        deviceId: `SCR-${String(i).padStart(3, '0')}A`,
        status: 'online',
        lat: poleLat, lng: poleLng,
        accessType: 'public', side: 'A', poleId: poleId
      });
      defaultScreens.push({
        name: `Pole ${i} - Back`,
        location: "Vijayawada MG Road Corridor",
        deviceId: `SCR-${String(i).padStart(3, '0')}B`,
        status: 'online',
        lat: poleLat, lng: poleLng,
        accessType: 'public', side: 'B', poleId: poleId
      });
    }
    
    const created = await Screen.insertMany(defaultScreens);
    
    // Link opposite screens
    for (let i = 0; i < created.length; i += 2) {
      const sA = created[i];
      const sB = created[i+1];
      await Screen.findByIdAndUpdate(sA._id, { oppositeScreenId: sB._id });
      await Screen.findByIdAndUpdate(sB._id, { oppositeScreenId: sA._id });
    }

    res.json({ msg: 'Inventory reset successful', count: created.length });
  } catch (err) {
    res.status(500).json({ msg: 'Server error during reset' });
  }
});

// POST /screens/:deviceId/k100c - K100C Bluetooth Controller endpoint on screens router
router.post(['/:deviceId/k100c', '/device/:deviceId/k100c'], async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const { power, brightness, mode, command } = req.body;

    const payload = {
      deviceId,
      power: power !== false,
      brightness: typeof brightness === 'number' ? Math.max(0, Math.min(100, brightness)) : 100,
      mode: mode || 'normal',
      command: command || '',
      timestamp: Date.now()
    };

    const io = req.app.get('io');
    if (io) {
      io.emit('k100c-command', payload);
      io.emit(`k100c-command-${deviceId}`, payload);
    }

    Screen.findOneAndUpdate(
      { $or: [{ deviceId }, { _id: mongoose.Types.ObjectId.isValid(deviceId) ? deviceId : null }] },
      {
        $set: {
          'k100cState.power': payload.power,
          'k100cState.brightness': payload.brightness,
          'k100cState.mode': payload.mode,
          'k100cState.lastCommand': payload.command,
          'k100cState.lastCommandAt': new Date()
        }
      },
      { upsert: true }
    ).catch(() => {});

    console.log(`📡 [K100C SCREENS ROUTE] Dispatched for ${deviceId}:`, payload);
    return res.json({ success: true, payload });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /screens/:deviceId/k100c/poll
router.get(['/:deviceId/k100c/poll', '/device/:deviceId/k100c/poll'], async (req, res) => {
  const deviceId = req.params.deviceId;
  return res.json({
    deviceId,
    power: true,
    brightness: 100,
    mode: 'normal',
    serverTime: new Date().toISOString()
  });
});

module.exports = router;
