const express = require('express');
const router = express.Router();
const SosAlert = require('../models/SosAlert');
const Screen = require('../models/Screen');
const { sendTelegramNotification } = require('../utils/telegramNotifier');
const { sendWhatsAppNotification } = require('../utils/whatsappNotifier');
const { processAndDispatchSosCctvVideo } = require('../services/sosVideoService');

// Helper to process and broadcast SOS alert
async function processSosAlert(req, res) {
  try {
    const data = req.body || {};
    const device = data.device || 'ESP32-SOS-01';
    const status = data.status || 'Active Emergency';
    const battery = Number(data.battery) || 100;
    const poleId = data.poleId || '';
    const rawLocation = data.location || 'Vijayawada MG Road Corridor';
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    // Find screen by poleId if provided
    let screenObj = null;
    if (poleId) {
      screenObj = await Screen.findOne({ poleId });
    }

    const alert = new SosAlert({
      device,
      status,
      battery,
      poleId,
      location: screenObj ? screenObj.location : rawLocation,
      screenId: screenObj ? screenObj._id : null,
      ipAddress
    });

    const savedAlert = await alert.save();
    console.log(`🚨 [SOS SYSTEM] Emergency alert registered from device: ${device} (${savedAlert.location})`);

    // 1. Send instant Telegram Emergency Alert
    const telegramMsg = `🚨 <b>SOS EMERGENCY ALERT TRIGGERED!</b> 🚨\n\n` +
      `📟 <b>Device:</b> ${savedAlert.device}\n` +
      `📍 <b>Location:</b> ${savedAlert.location}\n` +
      `📌 <b>Pole ID:</b> ${savedAlert.poleId || 'N/A'}\n` +
      `🔋 <b>Battery:</b> ${savedAlert.battery}%\n` +
      `⏰ <b>Time:</b> ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}\n` +
      `🌐 <b>IP:</b> <code>${savedAlert.ipAddress}</code>\n\n` +
      `👉 <i>Immediate emergency action required on site!</i>`;

    const lat = screenObj?.lat || 16.5062;
    const lng = screenObj?.lng || 80.6480;

    // 1. Send instant Telegram Emergency Alert
    sendTelegramNotification({
      isSOS: true,
      device: savedAlert.device,
      location: savedAlert.location,
      poleId: savedAlert.poleId,
      battery: savedAlert.battery,
      lat,
      lng
    }).catch(e => console.error('SOS Telegram dispatch error:', e.message));

    // 2. Dispatch latest 30-Second real CCTV video from sparsh-cam2 recorded at the time of pressing
    processAndDispatchSosCctvVideo({
      alertId: savedAlert._id,
      createdAt: savedAlert.createdAt,
      device: savedAlert.device,
      location: savedAlert.location,
      poleId: savedAlert.poleId,
      battery: savedAlert.battery,
      lat,
      lng
    }).catch(e => console.error('SOS CCTV video dispatch error:', e.message));

    // 2. Broadcast WebSocket event to all connected LED Screen Players & Dashboards
    const io = req.app.get('io');
    if (io) {
      io.emit('sos-alert', savedAlert);
      io.emit('emergency-override', {
        active: true,
        alertId: savedAlert._id,
        device: savedAlert.device,
        location: savedAlert.location,
        message: 'EMERGENCY SOS ALERT — PLEASE ASSIST IMMEDIATELY'
      });
    }

    return res.status(201).json({
      status: 'success',
      message: 'SOS alert registered successfully. Notifications and screen overrides dispatched.',
      data: savedAlert
    });
  } catch (err) {
    console.error('❌ SOS Processing Error:', err.message);
    return res.status(500).json({ status: 'error', message: err.message });
  }
}

// @route   POST api/sos
// @desc    Trigger emergency SOS alert (ESP32 hardware or Web client)
router.post('/', processSosAlert);

// @route   POST api/sos/trigger
router.post('/trigger', processSosAlert);

// @route   GET api/sos/alerts
// @desc    Get all emergency SOS alert records
router.get(['/', '/alerts'], async (req, res) => {
  try {
    const { status, resolved, search } = req.query;
    const filter = {};

    if (resolved !== undefined) {
      filter.resolved = resolved === 'true';
    }
    if (status) {
      filter.status = status;
    }
    if (search) {
      filter.$or = [
        { device: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { poleId: { $regex: search, $options: 'i' } }
      ];
    }

    const alerts = await SosAlert.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// @route   GET api/sos/status
// @desc    Get current SOS system health & alert metrics
router.get('/status', async (req, res) => {
  try {
    const totalCount = await SosAlert.countDocuments();
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await SosAlert.countDocuments({ createdAt: { $gte: todayStart } });
    
    const activeCount = await SosAlert.countDocuments({ resolved: false });

    res.json({
      status: 'active',
      activeEmergencies: activeCount,
      metrics: {
        totalAlerts: totalCount,
        todayAlerts: todayCount,
        activeAlerts: activeCount
      }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// @route   POST api/sos/resolve/:id
// @desc    Mark an SOS alert as resolved
router.post('/resolve/:id', async (req, res) => {
  try {
    const alert = await SosAlert.findByIdAndUpdate(
      req.params.id,
      { resolved: true, resolvedAt: new Date() },
      { new: true }
    );
    
    if (!alert) return res.status(404).json({ msg: 'Alert not found' });

    const io = req.app.get('io');
    if (io) {
      io.emit('sos-resolved', alert);
    }

    res.json({ status: 'success', message: 'Alert marked as resolved', data: alert });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// @route   POST api/sos/clear
// @desc    Clear all active SOS alerts
router.post('/clear', async (req, res) => {
  try {
    await SosAlert.updateMany({ resolved: false }, { resolved: true, resolvedAt: new Date() });
    
    const io = req.app.get('io');
    if (io) {
      io.emit('sos-clear-all');
    }

    res.json({ status: 'success', message: 'All active SOS alerts cleared' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
