const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const { RECORDINGS_DIR } = require('./cameraRecorderService');
const { getInternalCameraConfig } = require('./cameraService');

let ffmpegStatic = null;
if (!process.env.VERCEL) {
  try { ffmpegStatic = require('ffmpeg-static'); } catch (e) {}
}

const getFfmpegBin = () => {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  if (fs.existsSync('/opt/homebrew/bin/ffmpeg')) return '/opt/homebrew/bin/ffmpeg';
  if (fs.existsSync('/usr/local/bin/ffmpeg')) return '/usr/local/bin/ffmpeg';
  if (fs.existsSync('/usr/bin/ffmpeg')) return '/usr/bin/ffmpeg';
  return ffmpegStatic || 'ffmpeg';
};

const SOS_FOOTAGE_DIR = path.join(__dirname, '..', 'uploads', 'sos_footage');

if (!process.env.VERCEL && !fs.existsSync(SOS_FOOTAGE_DIR)) {
  try {
    fs.mkdirSync(SOS_FOOTAGE_DIR, { recursive: true });
  } catch (e) {
    console.error('Failed to create SOS footage dir:', e.message);
  }
}

/**
 * Locate camera ID based on pole ID / device info
 * Smart Pole 1 (ETHREE-P01) -> sparsh-cam2 (C:\led_server\backend\uploads\cctv_recordings\sparsh-cam2)
 * Smart Pole 2 (ETHREE-P02) -> sparsh-main (C:\led_server\backend\uploads\cctv_recordings\sparsh-main)
 */
const resolveCameraId = (poleId) => {
  if (!poleId) return 'sparsh-cam2'; // Default: Smart Pole 1
  const clean = String(poleId).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('p02') || clean.includes('pole2') || clean.endsWith('2') || clean === '2' || clean.includes('main')) {
    return 'sparsh-main'; // Smart Pole 2
  }
  return 'sparsh-cam2'; // Smart Pole 1
};

const net = require('net');

/**
 * Fast TCP probe to check if camera host/port is reachable in milliseconds
 */
const probeTcpPort = (host, port = 554, timeoutMs = 500) => new Promise((resolve) => {
  if (!host || !port) return resolve(false);
  const socket = new net.Socket();
  let done = false;
  socket.setTimeout(timeoutMs);
  socket.on('connect', () => {
    done = true;
    socket.destroy();
    resolve(true);
  });
  socket.on('timeout', () => {
    if (!done) { done = true; socket.destroy(); resolve(false); }
  });
  socket.on('error', () => {
    if (!done) { done = true; socket.destroy(); resolve(false); }
  });
  socket.connect(Number(port), host);
});

/**
 * Fast binary check to ensure the MP4 file has been closed by FFmpeg 
 * and has its faststart 'moov' atom header written.
 */
const isMp4Finalized = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (stat.size < 500000) return false; // Incomplete / empty chunk
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(4096);
    fs.readSync(fd, buf, 0, 4096, 0);
    fs.closeSync(fd);
    return buf.includes('moov');
  } catch (e) {
    return false;
  }
};

/**
 * Locate and retrieve the latest 30-second CCTV recording based on pole:
 * - Pole 1 (ETHREE-P01): C:\led_server\backend\uploads\cctv_recordings\sparsh-cam2
 * - Pole 2 (ETHREE-P02): C:\led_server\backend\uploads\cctv_recordings\sparsh-main
 * Recorded at the time of pressing. Never generates or sends a dummy test video.
 */
const getLatest30sCctvFootage = async (alertDetails = {}) => {
  const targetCamera = resolveCameraId(alertDetails.poleId);
  const fallbackCamera = targetCamera === 'sparsh-cam2' ? 'sparsh-main' : 'sparsh-cam2';
  const primaryDir = path.join(RECORDINGS_DIR, targetCamera);
  const fallbackDir = path.join(RECORDINGS_DIR, fallbackCamera);
  const candidateDirs = [primaryDir, fallbackDir];

  const poleLabel = targetCamera === 'sparsh-main' ? 'Smart Pole 2 (ETHREE-P02)' : 'Smart Pole 1 (ETHREE-P01)';
  console.log(`[SOS CCTV] 🔍 Searching for latest 30-second recording for ${poleLabel} [${targetCamera}] in: ${primaryDir}`);

  for (const camDir of candidateDirs) {
    if (!fs.existsSync(camDir)) continue;

    const getMp4Files = () => {
      try {
        return fs.readdirSync(camDir)
          .filter(f => f.endsWith('.mp4') && f.startsWith('rec_'))
          .map(f => path.join(camDir, f))
          .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
      } catch (e) {
        return [];
      }
    };

    let files = getMp4Files();
    if (files.length === 0) continue;

    // Check if the newest active recording is about to finish (within 8 seconds of completion)
    const newestFile = files[0];
    const newestBasename = path.basename(newestFile);
    const match = newestBasename.match(/rec_\d{4}-\d{2}-\d{2}_(\d{2})-(\d{2})-(\d{2})/);

    let waitMaxMs = 0;
    if (match) {
      const now = new Date();
      const h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const s = parseInt(match[3], 10);
      const startTime = new Date();
      startTime.setHours(h, m, s, 0);
      const elapsedSec = (now.getTime() - startTime.getTime()) / 1000;

      // If elapsedSec is between 22 and 33, it's about to finish within ~8 seconds!
      if (elapsedSec >= 22 && elapsedSec <= 33) {
        waitMaxMs = 8500;
      }
    }

    if (waitMaxMs > 0) {
      console.log(`[SOS CCTV] ⏳ Active 30s clip ${newestBasename} is finishing now. Waiting up to ${Math.round(waitMaxMs/1000)}s to capture the exact button press...`);
      const startWait = Date.now();
      while (Date.now() - startWait < waitMaxMs) {
        await new Promise(r => setTimeout(r, 600));
        if (isMp4Finalized(newestFile)) {
          console.log(`[SOS CCTV] ✅ Newly completed 30s clip finalized: ${newestBasename}`);
          return newestFile;
        }
        files = getMp4Files();
        if (files[0] !== newestFile && isMp4Finalized(newestFile)) {
          console.log(`[SOS CCTV] ✅ Newly completed 30s clip finalized: ${newestBasename}`);
          return newestFile;
        }
      }
    }

    // Refresh list and find the newest finalized, valid 30s MP4 file
    files = getMp4Files();
    for (const f of files) {
      if (isMp4Finalized(f)) {
        const stat = fs.statSync(f);
        console.log(`[SOS CCTV] 📹 Found latest 30-second camera recording: ${path.basename(f)} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
        return f;
      }
    }
  }

  // Fallback: If no recording was found on disk, attempt a direct 10s RTSP capture from target camera
  console.warn(`[SOS CCTV] ⚠️ No finalized recording found in folder — attempting direct RTSP grab from ${targetCamera} (NO dummy video)...`);
  const camConfig = getInternalCameraConfig(targetCamera) || getInternalCameraConfig(fallbackCamera);
  if (camConfig && (camConfig.subRtspUrl || camConfig.mainRtspUrl)) {
    const rtspUrl = camConfig.subRtspUrl || camConfig.mainRtspUrl;
    const ffmpegBin = getFfmpegBin();
    const emergencyOutput = path.join(SOS_FOOTAGE_DIR, `sos_live_grab_${Date.now()}.mp4`);

    try {
      await new Promise((resolve, reject) => {
        const proc = spawn(ffmpegBin, [
          '-y',
          '-rtsp_transport', 'tcp',
          '-i', rtspUrl,
          '-t', '10',
          '-c:v', 'copy',
          '-movflags', '+faststart',
          '-an',
          emergencyOutput
        ]);

        const killTimer = setTimeout(() => {
          try { proc.kill('SIGKILL'); } catch (e) {}
          reject(new Error('RTSP capture timed out'));
        }, 15000);

        proc.on('exit', (code) => {
          clearTimeout(killTimer);
          if (code === 0 && fs.existsSync(emergencyOutput) && fs.statSync(emergencyOutput).size > 100000) {
            resolve();
          } else {
            reject(new Error(`FFmpeg exited with code ${code}`));
          }
        });

        proc.on('error', (err) => {
          clearTimeout(killTimer);
          reject(err);
        });
      });

      if (fs.existsSync(emergencyOutput)) {
        return emergencyOutput;
      }
    } catch (e) {
      console.error('[SOS CCTV] Direct RTSP grab failed:', e.message);
    }
  }

  console.error('[SOS CCTV] ❌ Failed to obtain any camera recording. Refusing to send dummy video.');
  return null;
};

/**
 * Dispatch the 30-second camera video clip directly to all Telegram Admin chats
 */
const sendCctvVideoToTelegram = async (alertDetails, videoFilePath) => {
  const token = process.env.TELEGRAM_BOT_TOKEN || '8945142883:AAE2UFeMb6yTpDeSLSGf4bpE4SkQdGYWHVE';
  const chatIdsStr = process.env.TELEGRAM_CHAT_ID || '5339906035,1394203398,8918767093';

  if (!token || !chatIdsStr || !fs.existsSync(videoFilePath)) {
    console.log('ℹ️ Telegram CCTV video dispatch skipped: missing token or video file.');
    return;
  }

  const chatIds = chatIdsStr.split(',').map(id => id.trim()).filter(Boolean);
  const incidentDate = alertDetails.createdAt ? new Date(alertDetails.createdAt) : new Date();
  const timeStr = incidentDate.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';
  const dateStr = incidentDate.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' });

  const lat = alertDetails.lat || 16.5062;
  const lng = alertDetails.lng || 80.6480;
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  const fileName = path.basename(videoFilePath);
  const fileSizeMB = (fs.statSync(videoFilePath).size / (1024 * 1024)).toFixed(2);

  const targetCamera = resolveCameraId(alertDetails.poleId);
  const isPole2 = targetCamera === 'sparsh-main';
  const poleLabel = isPole2 ? 'Smart Pole 2 (ETHREE-P02)' : 'Smart Pole 1 (ETHREE-P01)';
  const cameraLabel = isPole2 ? 'Smart Pole 2 Camera (sparsh-main)' : 'Smart Pole 1 Camera (sparsh-cam2)';

  const caption = `🚨 <b>CCTV EMERGENCY FOOTAGE (30-SECOND CLIP)</b> 🚨\n\n` +
    `⏰ <b>Incident Timestamp:</b> ${dateStr} ${timeStr}\n` +
    `📍 <b>Location:</b> ${alertDetails.location || 'Vijayawada MG Road Corridor'}\n` +
    `📌 <b>Smart Pole:</b> ${poleLabel}\n` +
    `📟 <b>Trigger Device:</b> ${alertDetails.device || 'ESP32-SOS-01'}\n` +
    `🔋 <b>Battery:</b> ${alertDetails.battery || 100}%\n` +
    `📹 <b>Camera:</b> ${cameraLabel}\n` +
    `📁 <b>File:</b> <code>${fileName}</code> (${fileSizeMB} MB)\n` +
    `⏱️ <b>Clip Duration:</b> 30 seconds (Live CCTV Footage)\n\n` +
    `🗺️ <b>Live Location:</b> ${mapsUrl}\n\n` +
    `👉 <i>Real CCTV footage recorded at the exact moment of emergency button press!</i>`;

  const videoBuffer = fs.readFileSync(videoFilePath);
  let cachedFileId = null;

  for (const chatId of chatIds) {
    try {
      const formData = new FormData();
      formData.append('chat_id', chatId);
      if (cachedFileId) {
        formData.append('video', cachedFileId);
      } else {
        formData.append('video', new Blob([videoBuffer], { type: 'video/mp4' }), fileName);
      }
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      formData.append('supports_streaming', 'true');

      const response = await fetch(`https://api.telegram.org/bot${token}/sendVideo`, {
        method: 'POST',
        body: formData,
        signal: AbortSignal.timeout(60000)
      });

      const result = await response.json();
      if (result.ok) {
        if (!cachedFileId && result.result?.video?.file_id) {
          cachedFileId = result.result.video.file_id;
        }
        console.log(`✅ [Telegram Video] 30-Sec CCTV Footage (${fileName}) delivered to chat ${chatId} (Msg ID: ${result.result?.message_id})`);
      } else {
        console.error(`❌ [Telegram Video] Error sending to ${chatId}:`, result.description);
      }
    } catch (err) {
      console.error(`❌ [Telegram Video] Network error for ${chatId}:`, err.message);
    }
  }
};

/**
 * Full Workflow: Handles 30-second CCTV video retrieval and Telegram delivery for an SOS incident
 */
const processAndDispatchSosCctvVideo = async (alertDetails) => {
  try {
    console.log(`[SOS CCTV] 🎬 Initiating 30-second camera footage pipeline for ${alertDetails.device || 'ESP32-SOS'}`);
    const videoPath = await getLatest30sCctvFootage(alertDetails);
    if (videoPath) {
      await sendCctvVideoToTelegram(alertDetails, videoPath);
      console.log(`[SOS CCTV] 🎉 30-second CCTV video pipeline complete for ${path.basename(videoPath)}.`);
    } else {
      console.warn(`[SOS CCTV] ⚠️ Could not find or record real CCTV footage video.`);
    }
  } catch (err) {
    console.error(`[SOS CCTV] ❌ Video pipeline failure:`, err.message);
  }
};

module.exports = {
  generate1MinCctvFootage: getLatest30sCctvFootage,
  getLatest30sCctvFootage,
  sendCctvVideoToTelegram,
  processAndDispatchSosCctvVideo,
  resolveCameraId,
  SOS_FOOTAGE_DIR
};
