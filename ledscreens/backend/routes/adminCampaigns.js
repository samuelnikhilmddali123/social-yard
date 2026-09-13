const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Schedule = require('../models/Schedule');
const { getPresignedUrl } = require('../utils/s3');
const {
  syncScheduleStatus,
  buildApprovalUpdate,
} = require('../utils/scheduleLifecycle');

const updateScheduleStatus = syncScheduleStatus;

const mongoose = require('mongoose');

// Process lists of schedules: updates status and signs URLs
const processSchedules = async (schedules) => {
  if (!schedules || schedules.length === 0) return [];
  return Promise.all(schedules.map(async (s) => {
    try {
      // 1. Run dynamic lifecycle transitions
      const updatedSchedule = (await updateScheduleStatus(s)) || s;
      
      // 2. Convert to object and sign URL
      const sObj = updatedSchedule.toObject ? updatedSchedule.toObject({ virtuals: true }) : updatedSchedule;
      if (sObj && sObj.videoId && sObj.videoId.filePath) {
        try {
          sObj.videoId.url = await getPresignedUrl(sObj.videoId.filePath);
        } catch (e) {}
      }
      return sObj;
    } catch (e) {
      return s.toObject ? s.toObject({ virtuals: true }) : s;
    }
  }));
};

// Middleware to ensure user is admin
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Access denied: Admin role required' });
  }
  next();
};

const campaignPopulate = (query) =>
  query
    .populate('videoId')
    .populate('screenId')
    .populate('userId', 'name email phone');

// @route   GET api/admin/campaigns/counts
// @desc    Get dynamic counts for all campaign categories
router.get('/counts', auth, adminOnly, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ pending: 0, approved: 0, rejected: 0, upcoming: 0, active: 0, completed: 0, revoked: 0 });
    }

    const allSchedules = await Schedule.find();
    
    // Dynamically update status of all fetched items first to make counts 100% correct
    await Promise.all(allSchedules.map(s => updateScheduleStatus(s).catch(() => s)));
    
    const pending = await Schedule.countDocuments({ status: 'pending' });
    const approved = await Schedule.countDocuments({ status: { $in: ['approved', 'upcoming', 'active', 'completed'] } });
    const rejected = await Schedule.countDocuments({ status: 'rejected' });
    const upcoming = await Schedule.countDocuments({ status: 'upcoming' });
    const active = await Schedule.countDocuments({ status: 'active' });
    const completed = await Schedule.countDocuments({ status: 'completed' });
    const revoked = await Schedule.countDocuments({ status: 'revoked' });

    res.json({
      pending,
      approved,
      rejected,
      upcoming,
      active,
      completed,
      revoked
    });
  } catch (err) {
    console.error('Error fetching admin counts:', err.message);
    res.json({ pending: 0, approved: 0, rejected: 0, upcoming: 0, active: 0, completed: 0, revoked: 0 });
  }
});

// @route   GET api/admin/campaigns/pending
// @desc    Get all pending campaigns
router.get('/pending', auth, adminOnly, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    const list = await campaignPopulate(Schedule.find({ status: 'pending' }));
    const processed = await processSchedules(list);
    res.json(processed);
  } catch (err) {
    console.error('Error in /pending:', err.message);
    res.json([]);
  }
});

// @route   GET api/admin/campaigns/approved
// @desc    Get all approved campaigns (history of approved, upcoming, active, completed)
router.get('/approved', auth, adminOnly, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    const list = await campaignPopulate(Schedule.find({ status: { $in: ['approved', 'upcoming', 'active', 'completed'] } }));
    const processed = await processSchedules(list);
    res.json(processed);
  } catch (err) {
    console.error('Error in /approved:', err.message);
    res.json([]);
  }
});

// @route   GET api/admin/campaigns/rejected
// @desc    Get all rejected campaigns
router.get('/rejected', auth, adminOnly, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    const list = await campaignPopulate(Schedule.find({ status: 'rejected' }));
    const processed = await processSchedules(list);
    res.json(processed);
  } catch (err) {
    console.error('Error in /rejected:', err.message);
    res.json([]);
  }
});

// @route   GET api/admin/campaigns/upcoming
// @desc    Get all upcoming campaigns
router.get('/upcoming', auth, adminOnly, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    const list = await campaignPopulate(Schedule.find({ status: 'upcoming' }));
    const processed = await processSchedules(list);
    res.json(processed);
  } catch (err) {
    console.error('Error in /upcoming:', err.message);
    res.json([]);
  }
});

// @route   GET api/admin/campaigns/active
// @desc    Get all active campaigns
router.get('/active', auth, adminOnly, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    const list = await campaignPopulate(Schedule.find({ status: 'active' }));
    const processed = await processSchedules(list);
    res.json(processed);
  } catch (err) {
    console.error('Error in /active:', err.message);
    res.json([]);
  }
});

// @route   GET api/admin/campaigns/completed
// @desc    Get all completed campaigns
router.get('/completed', auth, adminOnly, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    const list = await campaignPopulate(Schedule.find({ status: 'completed' }));
    const processed = await processSchedules(list);
    res.json(processed);
  } catch (err) {
    console.error('Error in /completed:', err.message);
    res.json([]);
  }
});

// @route   GET api/admin/campaigns/revoked
// @desc    Get all revoked campaigns
router.get('/revoked', auth, adminOnly, async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) return res.json([]);
    const list = await campaignPopulate(Schedule.find({ status: 'revoked' }));
    const processed = await processSchedules(list);
    res.json(processed);
  } catch (err) {
    console.error('Error in /revoked:', err.message);
    res.json([]);
  }
});

// @route   PATCH api/admin/campaigns/:id/approve
// @desc    Approve a campaign
router.patch('/:id/approve', auth, adminOnly, async (req, res) => {
  try {
    const current = await Schedule.findById(req.params.id);
    if (!current) {
      return res.status(404).json({ msg: 'Campaign not found' });
    }

    const updateData = buildApprovalUpdate(current);

    let schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate('videoId').populate('screenId').populate('userId', 'name email phone');

    // Manual bookings: transition approved → active/upcoming/completed by time window
    if (!current.isInstant) {
      schedule = await updateScheduleStatus(schedule);
    }

    console.log(
      `✅ [APPROVE] ${schedule._id} | instant=${!!schedule.isInstant} | status=${schedule.status} | ${schedule.date} ${schedule.startTime}-${schedule.endTime}`
    );

    res.json(schedule);
  } catch (err) {
    console.error('Approve error:', err);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/admin/campaigns/:id/reject
// @desc    Reject a campaign
router.patch('/:id/reject', auth, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: 'rejected',
          rejectedAt: new Date(),
          rejectionReason: reason || ''
        } 
      },
      { new: true }
    ).populate('videoId').populate('screenId').populate('userId', 'name email phone');

    if (!schedule) {
      return res.status(404).json({ msg: 'Campaign not found' });
    }

    res.json(schedule);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/admin/campaigns/:id/revoke
// @desc    Revoke an approved campaign
router.patch('/:id/revoke', auth, adminOnly, async (req, res) => {
  try {
    const { reason } = req.body;
    const schedule = await Schedule.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status: 'revoked',
          revokedAt: new Date(),
          revokedReason: reason || '',
          revokedBy: req.user.email
        } 
      },
      { new: true }
    ).populate('videoId').populate('screenId').populate('userId', 'name email phone');

    if (!schedule) {
      return res.status(404).json({ msg: 'Campaign not found' });
    }

    res.json(schedule);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route   POST api/admin/campaigns/reset
// @desc    Clear all campaign schedules, uploaded videos, and reset screen statuses
router.post('/reset', auth, adminOnly, async (req, res) => {
  try {
    // 1. Delete all Schedule records
    await Schedule.deleteMany({});

    // 2. Delete all Video records
    const Video = require('../models/Video');
    await Video.deleteMany({});

    // 3. Reset all screen statuses to online
    const Screen = require('../models/Screen');
    await Screen.updateMany({}, { $set: { status: 'online' } });

    res.json({ msg: 'Database reset successful: All campaign, scheduling, and asset references cleared.' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/campaigns/corridor-state
// @desc    Live corridor state per screen derived from schedules
//          Returns: { [screenId]: { state: 'pending'|'booked', scheduleId, poleId, side, deviceId, videoTitle } }
router.get('/corridor-state', auth, adminOnly, async (req, res) => {
  try {
    const liveSchedules = await Schedule.find({
      status: { $in: ['pending', 'approved', 'upcoming', 'active'] }
    })
      .populate('screenId', 'poleId side name deviceId')
      .populate('videoId', 'title');

    const priority = { booked: 2, pending: 1 };
    const stateMap = {};

    for (const s of liveSchedules) {
      if (!s.screenId) continue;
      const sid = s.screenId._id.toString();
      const state = s.status === 'pending' ? 'pending' : 'booked';
      const existing = stateMap[sid];

      if (!existing || (priority[state] || 0) > (priority[existing.state] || 0)) {
        stateMap[sid] = {
          state,
          scheduleId: s._id.toString(),
          scheduleStatus: s.status,
          poleId: s.screenId.poleId || s.screenId.name || '',
          side: s.screenId.side || 'A',
          deviceId: s.screenId.deviceId || '',
          videoTitle: s.videoId?.title || ''
        };
      }
    }

    res.json(stateMap);
  } catch (err) {
    console.error('Corridor state error:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
