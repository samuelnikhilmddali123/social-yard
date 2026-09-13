const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Screen = require('../models/Screen');
const Schedule = require('../models/Schedule');
const Video = require('../models/Video');
const { getPresignedUrl } = require('../utils/s3');
const {
  LIFECYCLE_STATUSES,
  syncScheduleStatus,
  isInPlaybackWindow,
  findPlayableSchedule,
  getISTNow,
} = require('../utils/scheduleLifecycle');

const liveFrames = {};

router.post('/:deviceId/frame', async (req, res) => {
  const { deviceId } = req.params;
  const { frame } = req.body;
  if (!frame) return res.status(400).json({ msg: 'No frame data' });

  liveFrames[deviceId] = { data: frame, timestamp: Date.now() };
  res.json({ success: true });
});

router.get('/:deviceId/frame', async (req, res) => {
  const { deviceId } = req.params;
  const frame = liveFrames[deviceId];
  if (!frame) return res.status(404).json({ msg: 'No frame available' });
  if (Date.now() - frame.timestamp > 30000) {
    return res.status(404).json({ msg: 'Stream offline' });
  }
  res.json({ frame: frame.data });
});

router.get('/debug/all', async (req, res) => {
  try {
    const screens = await Screen.find();
    const schedules = await Schedule.find().populate('videoId').populate('screenId');
    res.json({ screens, schedules, serverTime: new Date().toISOString(), ist: getISTNow() });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.all('/clear/all-ads', async (req, res) => {
  try {
    const result = await Schedule.updateMany(
      { status: { $in: ['active', 'approved', 'upcoming'] } },
      { $set: { status: 'completed', completedAt: new Date() } }
    );
    res.json({ success: true, msg: 'All active ads cleared successfully', modifiedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/lookup/:domain', async (req, res) => {
  try {
    const screen = await Screen.findOne({ domain: req.params.domain });
    if (!screen) return res.status(404).json({ msg: 'No screen mapped to this domain' });
    res.json({ deviceId: screen.deviceId });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

router.get('/:deviceId', async (req, res) => {
  const { deviceId } = req.params;
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  const screenNameMap = {
    'ethree-75': 'eThree 75" Grand Display',
    'ethree-65': 'eThree 65" Display',
    'ethree-pole1': 'Pole 1 (5x3 Screen)',
    'ethree-pole2': 'Pole 2 (5x3 Screen)'
  };

  // Fallback showcase data if DB is disconnected and no approved campaign exists
  const fallbackResponse = {
    isFallback: true,
    screen: { deviceId, name: screenNameMap[deviceId] || `eThree ${deviceId}`, status: 'online' },
    playlist: [
      {
        scheduleId: 'fallback-01',
        title: 'E3Di Brand Showcase 1',
        url: '/IMG_6479.mp4',
        durationSeconds: 15
      },
      {
        scheduleId: 'fallback-02',
        title: 'E3Di Brand Showcase 2',
        url: '/WhatsApp Video 2026-07-29 at 18.38.33.mp4',
        durationSeconds: 15
      }
    ],
    current: {
      id: 'fallback-01',
      title: 'E3Di Brand Showcase 1',
      url: '/IMG_6479.mp4',
      durationSeconds: 15
    }
  };

  try {
    let approvedSchedules = [];

    if (mongoose.connection.readyState === 1) {
      try {
        let screen = await Screen.findOne({ deviceId });
        let queryOr = [];
        if (screen) {
          queryOr.push({ screenId: screen._id });
        }
        if (mongoose.Types.ObjectId.isValid(deviceId)) {
          queryOr.push({ screenId: deviceId });
        }

        if (queryOr.length > 0) {
          const rawSchedules = await Schedule.find({
            $or: queryOr,
            status: { $in: ['approved', 'active', 'upcoming'] }
          }).sort({ approvedAt: -1, createdAt: -1 }).populate('videoId');

          const nowMs = Date.now();

          for (const s of rawSchedules) {
            const synced = await syncScheduleStatus(s);
            if (!synced) continue;
            if (!synced.videoId) continue;

            // Always include 'active' schedules
            if (synced.status === 'active') {
              approvedSchedules.push(synced);
              continue;
            }

            // For 'approved' and 'upcoming': apply time window check
            if (synced.date && synced.startTime && synced.endTime) {
              const startMs = new Date(`${synced.date}T${synced.startTime}:00+05:30`).getTime();
              // Include the entire end minute up to :59.999
              const endMs   = new Date(`${synced.date}T${synced.endTime}:59.999+05:30`).getTime();

              // Skip if start time hasn't arrived yet
              if (nowMs < startMs) {
                console.log(`[DEVICE] ⏳ Not yet: ${synced.date} ${synced.startTime}`);
                continue;
              }
              // Skip if end time already passed
              if (nowMs > endMs) {
                console.log(`[DEVICE] ✅ Ended: ${synced.date} ${synced.endTime}`);
                continue;
              }
              // Within window — include
              approvedSchedules.push(synced);
            } else {
              // No date/time set — include anyway (instant / manual)
              approvedSchedules.push(synced);
            }
          }
        }

      } catch (dbQueryErr) {
        console.warn(`[DEVICE] DB query warning for ${deviceId}:`, dbQueryErr.message);
      }
    }

    // Include global in-memory schedules
    if (global.inMemorySchedules && global.inMemorySchedules.length > 0) {
      const memApproved = global.inMemorySchedules.filter(s =>
        ['approved', 'active', 'upcoming', 'pending'].includes(s.status)
      );
      approvedSchedules = [...approvedSchedules, ...memApproved];
    }

    const playlist = [];
    for (const fullSched of approvedSchedules) {
      let rawUrl = '';
      let title = 'Campaign Ad';
      let scheduleId = fullSched._id ? fullSched._id.toString() : 'sched-' + Date.now();

      if (fullSched.videoId) {
        if (typeof fullSched.videoId === 'object' && fullSched.videoId !== null) {
          rawUrl = fullSched.videoId.filePath || fullSched.videoId.url || '';
          title = fullSched.videoId.title || title;
        } else {
          try {
            const vDoc = await Video.findById(fullSched.videoId);
            if (vDoc) {
              rawUrl = vDoc.filePath || vDoc.url || '';
              title = vDoc.title || title;
            }
          } catch (vErr) {}
        }
      }

      if (rawUrl) {
        let mediaUrl = rawUrl;
        if (mediaUrl && !mediaUrl.startsWith('http')) {
          if (mediaUrl.includes('uploads/')) {
            const cleanPath = mediaUrl.startsWith('/') ? mediaUrl : `/${mediaUrl}`;
            mediaUrl = cleanPath;
          } else {
            try {
              const s3Url = await getPresignedUrl(mediaUrl);
              if (s3Url) mediaUrl = s3Url;
            } catch (e) {}
          }
        }
        if (mediaUrl) {
          playlist.push({
            _id: scheduleId,
            scheduleId: scheduleId,
            title: title,
            url: mediaUrl,
            durationSeconds: fullSched.durationSeconds || 15,
            hasWatermark: fullSched.hasWatermark !== false,
            date: fullSched.date || null,
            startTime: fullSched.startTime || null,
            endTime: fullSched.endTime || null,
          });
        }
      }
    }

    if (playlist.length > 0) {
      return res.json({
        playlist,
        current: playlist[0],
        next: playlist[1] || playlist[0],
        screen: {
          name: screenNameMap[deviceId] || `eThree ${deviceId}`,
          location: 'eThree Billboard Location',
          deviceId: deviceId,
          status: 'online',
          soundEnabled: false,
          volume: 50,
        }
      });
    }

    // Special behavior for ethree-landscape: DO NOT auto-play filler videos if no user ads booked
    if (deviceId === 'ethree-landscape' || deviceId.includes('landscape')) {
      return res.json({
        isFallback: false,
        isNoUserAds: true,
        playlist: [],
        current: null,
        next: null,
        screen: {
          name: 'eThree 16:9 Social Ads Landscape Display',
          location: 'Social Ads Widescreen Corridor',
          deviceId: deviceId,
          status: 'online',
          soundEnabled: false,
          volume: 50,
        }
      });
    }

    return res.json(fallbackResponse);
  } catch (err) {
    console.error(`[DEVICE] Router error for ${deviceId}:`, err.message);
    return res.json(fallbackResponse);
  }
});

// PATCH /device/:deviceId/audio - Admin remote audio control
router.patch('/:deviceId/audio', async (req, res) => {
  try {
    const { soundEnabled, volume } = req.body;
    const updates = {};
    if (typeof soundEnabled === 'boolean') updates.soundEnabled = soundEnabled;
    if (typeof volume === 'number') updates.volume = Math.max(0, Math.min(100, volume));

    const screen = await Screen.findOneAndUpdate(
      { deviceId: req.params.deviceId },
      { $set: updates },
      { new: true }
    );
    if (!screen) return res.status(404).json({ msg: 'Screen not found' });
    res.json({ soundEnabled: screen.soundEnabled, volume: screen.volume });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// In-memory real-time state cache for instant response & offline resilience
const inMemoryK100cState = {};

// POST /device/:deviceId/k100c - Admin sends BLE commands to K100C via ESP32 Cloud Bridge
router.post('/:deviceId/k100c', async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const { power, brightness, mode, command } = req.body;

    // 1. Update in-memory state immediately (zero delay)
    if (!inMemoryK100cState[deviceId]) {
      inMemoryK100cState[deviceId] = {
        power: true,
        brightness: 100,
        mode: 'normal',
        command: '',
        lastCommandAt: new Date()
      };
    }

    const state = inMemoryK100cState[deviceId];
    if (typeof power === 'boolean') state.power = power;
    if (typeof brightness === 'number') state.brightness = Math.max(0, Math.min(100, brightness));
    if (mode) state.mode = mode;
    if (command) state.command = command;
    state.lastCommandAt = new Date();

    const payload = {
      deviceId,
      power: state.power,
      brightness: state.brightness,
      mode: state.mode,
      command: state.command || '',
      timestamp: Date.now()
    };

    // 2. Broadcast via WebSocket immediately
    const io = req.app.get('io');
    if (io) {
      io.emit('k100c-command', payload);
      io.emit(`k100c-command-${deviceId}`, payload);
    }

    // 3. Persist to MongoDB in background without blocking response
    Screen.findOneAndUpdate(
      { deviceId },
      {
        $set: {
          'k100cState.power': state.power,
          'k100cState.brightness': state.brightness,
          'k100cState.mode': state.mode,
          'k100cState.lastCommand': state.command,
          'k100cState.lastCommandAt': state.lastCommandAt
        }
      },
      { upsert: true }
    ).catch(e => console.warn(`DB sync warning for ${deviceId}:`, e.message));

    console.log(`📡 [K100C BRIDGE] Dispatched for ${deviceId}: Power=${state.power}, Brightness=${state.brightness}%, Mode=${state.mode}`);
    return res.json({ success: true, k100cState: state, payload });
  } catch (err) {
    console.error('❌ K100C command error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /device/:deviceId/k100c/poll - ESP32 polls latest state over WiFi
router.get('/:deviceId/k100c/poll', async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    const state = inMemoryK100cState[deviceId] || {
      power: true,
      brightness: 100,
      mode: 'normal',
      command: '',
      lastCommandAt: new Date()
    };

    return res.json({
      deviceId,
      power: state.power,
      brightness: state.brightness,
      mode: state.mode,
      command: state.command,
      lastCommandAt: state.lastCommandAt,
      serverTime: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /device/:deviceId/k100c/heartbeat - ESP32 reports BLE connection & telemetry
router.post('/:deviceId/k100c/heartbeat', async (req, res) => {
  try {
    const { bleConnected } = req.body;
    if (inMemoryK100cState[req.params.deviceId]) {
      inMemoryK100cState[req.params.deviceId].bleConnected = !!bleConnected;
    }
    return res.json({ ok: true, serverTime: Date.now() });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
