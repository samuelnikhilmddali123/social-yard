/**
 * E3DI High-Performance Local CCTV Storage & Recording Service
 * 
 * Features:
 * - 30-second segmented MP4 recording (-segment_time 30)
 * - Zero-CPU bitstream copy (-c:v copy) directly from RTSP
 * - Non-blocking child process with drained stderr pipe (prevents OS pipe deadlocks)
 * - Auto-reconnect resilience on network drops
 * - Automatic retention policy (prunes recordings older than 7 days)
 * - Local server storage indexed by camera and date
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
let ffmpegStatic = null;
if (!process.env.VERCEL) {
  try { ffmpegStatic = require('ffmpeg-static'); } catch (e) {}
}
const { getInternalCameraConfig } = require('./cameraService');

const RECORDINGS_DIR = path.join(__dirname, '..', 'uploads', 'cctv_recordings');

// Ensure base recording directory exists
if (!process.env.VERCEL && !fs.existsSync(RECORDINGS_DIR)) {
  try { fs.mkdirSync(RECORDINGS_DIR, { recursive: true }); } catch (e) {}
}

// Active recording process map: cameraId -> { process, startTime, retentionDays, manualStop }
const activeRecorders = new Map();

// Recording settings store
const recordingConfigs = new Map();

/**
 * Start continuous local server recording for a camera (30-second segments)
 */
const startRecording = (cameraId, options = {}) => {
  const retentionHours = options.retentionHours || (options.retentionDays ? options.retentionDays * 24 : 24);
  const useSubStream = options.useSubStream === true;

  if (activeRecorders.has(cameraId)) {
    const existing = activeRecorders.get(cameraId);
    if (existing.process && !existing.process.killed) {
      return { status: 'already_recording', cameraId };
    }
  }

  const camConfig = getInternalCameraConfig(cameraId);
  if (!camConfig || !camConfig.mainRtspUrl) {
    console.log(`[CCTV Recorder] Cannot record ${cameraId}: No valid RTSP configuration`);
    return { status: 'failed', error: 'No RTSP configuration' };
  }

  const rtspUrl = useSubStream && camConfig.subRtspUrl ? camConfig.subRtspUrl : camConfig.mainRtspUrl;
  const camDir = path.join(RECORDINGS_DIR, cameraId);
  if (!fs.existsSync(camDir)) {
    fs.mkdirSync(camDir, { recursive: true });
  }

  const ffmpegBin = process.env.FFMPEG_PATH || ffmpegStatic || 'ffmpeg';
  const outPattern = `${camDir.replace(/\\/g, '/')}/rec_%Y-%m-%d_%H-%M-%S.mp4`;

  // High-speed stream copy arguments (0% CPU re-encoding, standalone 30-second faststart MP4s)
  const args = [
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-c:v', 'copy',
    '-an',
    '-f', 'segment',
    '-segment_time', '30', // Exact 30-second segments
    '-segment_format_options', 'movflags=+faststart',
    '-reset_timestamps', '1',
    '-strftime', '1',
    outPattern
  ];

  console.log(`[CCTV Recorder] 🔴 Starting continuous 30-second local recording for ${cameraId} (24h retention)`);
  const proc = spawn(ffmpegBin, args, {
    stdio: ['ignore', 'ignore', 'pipe']
  });

  const recorderSession = {
    cameraId,
    process: proc,
    startTime: Date.now(),
    retentionHours,
    manualStop: false
  };

  // CRITICAL: Continuously drain stderr pipe so FFmpeg never blocks
  proc.stderr.on('data', (chunk) => {
    const msg = chunk.toString();
    if (msg.includes('Error') || msg.includes('Connection refused') || msg.includes('401 Unauthorized')) {
      console.warn(`[CCTV Recorder ${cameraId} ERR] ${msg.trim()}`);
    }
  });

  proc.on('exit', (code) => {
    console.log(`[CCTV Recorder] Recording process exited for ${cameraId} (code ${code})`);
    activeRecorders.delete(cameraId);

    // Auto-reconnect if recording is enabled and not manually stopped
    const cfg = recordingConfigs.get(cameraId);
    if (cfg && cfg.enabled && !recorderSession.manualStop) {
      console.log(`[CCTV Recorder] Auto-resuming 30s recording for ${cameraId} in 3s...`);
      setTimeout(() => {
        startRecording(cameraId, options);
      }, 3000);
    }
  });

  activeRecorders.set(cameraId, recorderSession);
  recordingConfigs.set(cameraId, { enabled: true, retentionHours });

  // Run initial disk cleanup for footage older than 24 hours
  pruneOldRecordings(cameraId, retentionHours);

  return { status: 'recording_started', cameraId, segmentDurationSec: 30, retentionHours };
};

/**
 * Stop local recording for a camera
 */
const stopRecording = (cameraId) => {
  const session = activeRecorders.get(cameraId);
  if (session && session.process) {
    session.manualStop = true;
    session.process.kill('SIGTERM');
    activeRecorders.delete(cameraId);
    recordingConfigs.set(cameraId, { enabled: false });
    console.log(`[CCTV Recorder] ⏹️ Stopped recording for ${cameraId}`);
    return { status: 'stopped', cameraId };
  }
  return { status: 'not_running', cameraId };
};

/**
 * List all saved local recordings for a camera grouped by date
 */
const listRecordings = (cameraId) => {
  const camDir = path.join(RECORDINGS_DIR, cameraId);
  if (!fs.existsSync(camDir)) {
    return [];
  }

  const groupsByDate = new Map();

  const addFile = (filename, folderPath, dateStr) => {
    try {
      const filePath = path.join(folderPath, filename);
      const stat = fs.statSync(filePath);
      if (stat.size > 0) {
        if (!groupsByDate.has(dateStr)) {
          groupsByDate.set(dateStr, []);
        }
        groupsByDate.get(dateStr).push({
          filename,
          date: dateStr,
          sizeBytes: stat.size,
          sizeMB: (stat.size / (1024 * 1024)).toFixed(2),
          durationSec: 30,
          createdAt: stat.birthtime || stat.mtime,
          playbackUrl: `/api/admin/cameras/${cameraId}/recordings/${filename}`
        });
      }
    } catch (e) {}
  };

  try {
    const entries = fs.readdirSync(camDir);
    for (const entry of entries) {
      const fullPath = path.join(camDir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Date subdirectory
        const dateStr = entry;
        try {
          const subFiles = fs.readdirSync(fullPath).filter(f => f.endsWith('.mp4'));
          for (const subF of subFiles) {
            addFile(subF, fullPath, dateStr);
          }
        } catch (e) {}
      } else if (entry.endsWith('.mp4')) {
        // Flat file in camDir: rec_YYYY-MM-DD_HH-MM-SS.mp4
        const dateMatch = entry.match(/rec_(\d{4}-\d{2}-\d{2})_/);
        const dateStr = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
        addFile(entry, camDir, dateStr);
      }
    }
  } catch (e) {}

  const result = [];
  const sortedDates = Array.from(groupsByDate.keys()).sort().reverse();

  for (const date of sortedDates) {
    const files = groupsByDate.get(date);
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    result.push({
      date,
      totalFiles: files.length,
      files
    });
  }

  return result;
};

/**
 * Automatic retention cleaner: Delete recordings older than retentionHours (default: 24 hours)
 * Ensures full current day footage is saved and only clips older than 24 hours are removed.
 */
const pruneOldRecordings = (cameraId, retentionHours = 24) => {
  const camDir = path.join(RECORDINGS_DIR, cameraId);
  if (!fs.existsSync(camDir)) return;

  const cutoffTime = Date.now() - (retentionHours * 60 * 60 * 1000);
  try {
    const entries = fs.readdirSync(camDir);
    for (const entry of entries) {
      const fullPath = path.join(camDir, entry);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const subFiles = fs.readdirSync(fullPath);
        for (const f of subFiles) {
          const subPath = path.join(fullPath, f);
          const subStat = fs.statSync(subPath);
          if (subStat.mtimeMs < cutoffTime) {
            try { fs.unlinkSync(subPath); } catch (e) {}
          }
        }
        if (fs.readdirSync(fullPath).length === 0) {
          try { fs.rmdirSync(fullPath); } catch (e) {}
        }
      } else if (entry.endsWith('.mp4')) {
        if (stat.mtimeMs < cutoffTime) {
          try { fs.unlinkSync(fullPath); } catch (e) {}
        }
      }
    }
  } catch (e) {}
};

/**
 * Get active recording status
 */
const getRecordingStatus = (cameraId) => {
  const session = activeRecorders.get(cameraId);
  const isRec = !!(session && session.process && !session.process.killed);
  const config = recordingConfigs.get(cameraId) || { enabled: isRec, retentionHours: 24 };
  return {
    cameraId,
    isRecording: isRec,
    segmentDurationSec: 30,
    config
  };
};

/**
 * Automatically start 30-second recording for both cameras on server startup (24-hour retention)
 */
const initAutoRecording = () => {
  console.log('[CCTV Recorder] 🚀 Initializing continuous 30-second local server recording for all cameras (24h retention)...');
  setTimeout(() => {
    startRecording('sparsh-main', { retentionHours: 24 });
    startRecording('sparsh-cam2', { retentionHours: 24 });
  }, 3000);

  // Hourly retention pruning check to delete footage only after 24 hours
  setInterval(() => {
    pruneOldRecordings('sparsh-main', 24);
    pruneOldRecordings('sparsh-cam2', 24);
  }, 60 * 60 * 1000);
};

module.exports = {
  startRecording,
  stopRecording,
  listRecordings,
  getRecordingStatus,
  initAutoRecording,
  RECORDINGS_DIR
};
