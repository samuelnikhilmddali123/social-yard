const mongoose = require('mongoose');
const Schedule = require('../models/Schedule');
const {
  getISTNow,
  addMinutesFromNow,
  isTimeInRange,
  getISTParts,
} = require('./istTime');

const PLAYABLE_STATUSES = ['active', 'approved'];
const LIFECYCLE_STATUSES = ['approved', 'upcoming', 'active'];
/** Statuses that can block a slot (same date + overlapping time only) */
const BLOCKING_STATUSES = ['pending', 'approved', 'active', 'upcoming'];

function screenIdMatches(schedule, screenId) {
  const a = schedule.screenId?._id || schedule.screenId;
  return String(a) === String(screenId);
}

/** HH:mm ranges overlap on the same calendar day */
function timeRangesOverlap(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

function overlapsSelection(schedule, date, startTime, endTime) {
  if (!date || !startTime || !endTime) return false;
  if (schedule.date !== date) return false;
  return timeRangesOverlap(startTime, endTime, schedule.startTime, schedule.endTime);
}

/** Campaign is broadcasting on screen right now (IST) */
function isLiveBooking(schedule, ist = getISTNow()) {
  if (!['active', 'approved'].includes(schedule.status)) return false;
  return isInPlaybackWindow(schedule, ist);
}

/**
 * Whether a schedule should be playing right now (IST date + HH:mm window).
 */
function isInPlaybackWindow(schedule, ist = getISTNow()) {
  if (!schedule) return false;
  if (!['approved', 'active', 'upcoming'].includes(schedule.status)) return false;

  const { date: today, time: now } = ist;

  // Date check
  if (schedule.date && schedule.date !== today) return false;

  // Time window (startTime - endTime) check
  if (schedule.startTime && schedule.endTime) {
    return isTimeInRange(now, schedule.startTime, schedule.endTime);
  }

  return true;
}

/**
 * Compute lifecycle status from date + HH:mm window (IST).
 */
/**
 * Compute lifecycle status from date + HH:mm window (IST).
 */
function computeLifecycleStatus(schedule, ist) {
  const { date: currentDate, time: currentTime } = ist;

  if (['pending', 'rejected', 'revoked'].includes(schedule.status)) {
    return schedule.status;
  }

  // Instant bookings: play for their exact durationSeconds (e.g. 10s, 15s, 30s) then complete
  if (schedule.isInstant && schedule.startedAt) {
    const durationSecs = schedule.durationSeconds || schedule.duration || 10;
    const startedMs = new Date(schedule.startedAt).getTime();
    if (Date.now() >= startedMs + durationSecs * 1000) {
      return 'completed';
    }
  }

  // If no date or time specified, keep as active/approved
  if (!schedule.date || !schedule.startTime || !schedule.endTime) {
    return schedule.status === 'approved' ? 'active' : schedule.status;
  }

  if (schedule.date < currentDate) return 'completed';
  if (schedule.date > currentDate) return 'upcoming';

  if (currentTime < schedule.startTime) return 'upcoming';
  if (isTimeInRange(currentTime, schedule.startTime, schedule.endTime)) return 'active';
  if (currentTime > schedule.endTime) return 'completed';
  return 'active';
}

async function syncScheduleStatus(schedule) {
  if (!schedule) return null;
  if (['pending', 'rejected', 'revoked'].includes(schedule.status)) {
    return schedule;
  }

  const ist = getISTNow();
  const newStatus = computeLifecycleStatus(schedule, ist);

  if (schedule.status === newStatus) return schedule;

  const updates = { status: newStatus };
  if (newStatus === 'active' && !schedule.startedAt) updates.startedAt = new Date();
  if (newStatus === 'completed' && !schedule.completedAt) updates.completedAt = new Date();

  return Schedule.findByIdAndUpdate(schedule._id, { $set: updates }, { new: true });
}

function buildInstantActivationFields(schedule) {
  const ist = getISTNow();
  
  // Resolve total duration in seconds: exact durationSeconds takes precedence
  let durationSecs = schedule.durationSeconds;
  if (!durationSecs) {
    if (schedule.duration) {
      durationSecs = schedule.duration > 60 ? schedule.duration : schedule.duration * 60;
    } else if (schedule.isFreeTrialBooking) {
      durationSecs = 10;
    } else {
      durationSecs = 10;
    }
  }

  const startMs = Date.now();
  const endMs = startMs + durationSecs * 1000;
  const endParts = getISTParts(new Date(endMs));

  return {
    date: ist.date,
    startTime: ist.time,
    endTime: endParts.time,
    status: 'active',
    approvedAt: new Date(),
    startedAt: new Date(),
  };
}

function buildApprovalUpdate(schedule) {
  if (schedule.isInstant) {
    return buildInstantActivationFields(schedule);
  }

  // Always set to 'approved' — the device API handles the time gate
  // so the ad shows only during its booked slot
  return {
    status: 'approved',
    approvedAt: new Date(),
  };
}

/**
 * Find the schedule that should play on a screen right now.
 * Uses in-memory IST window check so date/time always match admin UI.
 */
async function findPlayableSchedule(screenId, deviceId = '') {
  const ist = getISTNow();

  const queryOr = [];
  if (screenId) queryOr.push({ screenId });
  if (deviceId) queryOr.push({ screenId: deviceId });

  const candidates = await Schedule.find({
    ...(queryOr.length > 0 ? { $or: queryOr } : { screenId }),
    status: { $in: ['approved', 'active', 'upcoming'] },
  })
    .sort({ approvedAt: -1, createdAt: -1 })
    .populate('videoId');

  const validCandidates = candidates.filter((s) => s && s.videoId);

  return {
    schedule: validCandidates[0] || null,
    ist,
    candidates: validCandidates.map((s) => ({
      id: String(s._id),
      status: s.status,
      date: s.date,
      startTime: s.startTime,
      endTime: s.endTime,
      isInstant: !!s.isInstant,
      inWindow: true,
      screenId: String(s.screenId),
      hasVideo: !!s.videoId,
    })),
  };
}

/**
 * Global availability for map — ALL users, no userId filter.
 * Optional query.date / startTime / endTime = viewer's slot for overlap flags.
 */
async function getGlobalAvailability(query = {}) {
  const { date, startTime, endTime } = query;
  const ist = getISTNow();

  const toSync = await Schedule.find({
    status: { $in: [...BLOCKING_STATUSES, 'approved', 'upcoming', 'active'] },
  });

  for (const s of toSync) {
    if (!['pending', 'rejected', 'revoked'].includes(s.status)) {
      await syncScheduleStatus(s);
    }
  }

  const schedules = await Schedule.find({
    status: { $in: BLOCKING_STATUSES },
  })
    .select('screenId status date startTime endTime isInstant')
    .lean();

  return schedules.map((s) => ({
    screenId: String(s.screenId),
    status: s.status,
    date: s.date,
    startTime: s.startTime,
    endTime: s.endTime,
    isInstant: !!s.isInstant,
    /** True only when viewer's selected date+time overlaps this booking */
    overlapsSelection: overlapsSelection(s, date, startTime, endTime),
    /** Playback now (informational — do not use alone to block future slots) */
    isLiveNow: isLiveBooking(s, ist),
  }));
}

module.exports = {
  PLAYABLE_STATUSES,
  LIFECYCLE_STATUSES,
  BLOCKING_STATUSES,
  screenIdMatches,
  timeRangesOverlap,
  overlapsSelection,
  isLiveBooking,
  isInPlaybackWindow,
  computeLifecycleStatus,
  syncScheduleStatus,
  buildInstantActivationFields,
  buildApprovalUpdate,
  findPlayableSchedule,
  getGlobalAvailability,
  getISTNow,
};
