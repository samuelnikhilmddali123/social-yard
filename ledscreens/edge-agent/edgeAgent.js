/**
 * E3DI Site-Based CCTV Edge Agent Application
 * 
 * Runs locally on the same LAN as the IP camera (e.g. Sparsh SC-INA50B-3P25).
 * Connects OUTBOUND to E3DI Cloud Server (api.e3di.org).
 * Cloud server NEVER connects inbound to private camera IPs (192.168.1.108).
 */

require('dotenv').config();
const io = require('socket.io-client');
const axios = require('axios');
const si = require('systeminformation');
const { spawn } = require('child_process');
const net = require('net');
const fs = require('fs');
const path = require('path');

let ffmpegBin = process.env.FFMPEG_PATH;
if (!ffmpegBin) {
  try {
    ffmpegBin = require('ffmpeg-static');
  } catch (e) {
    const backendFfmpeg = path.join(__dirname, '..', 'backend', 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
    if (fs.existsSync(backendFfmpeg)) {
      ffmpegBin = backendFfmpeg;
    } else {
      ffmpegBin = 'ffmpeg';
    }
  }
}

const CLOUD_URL = process.env.CLOUD_SERVER_URL || 'http://localhost:5000';
const EDGE_ID = process.env.EDGE_ID || 'EDGE-001';
const SITE_ID = process.env.SITE_ID || 'SITE-001';
const AGENT_NAME = process.env.AGENT_NAME || 'Site 001 CCTV Gateway';
const AGENT_VERSION = process.env.AGENT_VERSION || '1.0.0';

// Edge Multi-Camera Registry (Local LAN Credentials - NEVER LEAVE LOCAL EDGE)
const CAMERAS = {
  'sparsh-cam2': {
    id: 'sparsh-cam2',
    name: 'Smart Pole 1 Camera (192.168.1.4)',
    poleId: 'ETHREE-P01',
    host: process.env.CAMERA2_HOST || '192.168.1.4',
    port: process.env.CAMERA2_RTSP_PORT || '554',
    user: process.env.CAMERA2_USERNAME || 'admin',
    pass: process.env.CAMERA2_PASSWORD !== undefined ? process.env.CAMERA2_PASSWORD : '',
    mainStream: process.env.CAMERA2_MAIN_STREAM || '/stream0',
    subStream: process.env.CAMERA2_SUB_STREAM || '/stream1'
  },
  'sparsh-main': {
    id: 'sparsh-main',
    name: 'Smart Pole 2 Camera (192.168.1.108)',
    poleId: 'ETHREE-P02',
    host: process.env.CAMERA_HOST || '192.168.1.108',
    port: process.env.CAMERA_RTSP_PORT || '554',
    user: process.env.CAMERA_USERNAME || 'admin',
    pass: process.env.CAMERA_PASSWORD !== undefined ? process.env.CAMERA_PASSWORD : '',
    mainStream: process.env.CAMERA_MAIN_STREAM || '/h264/ch1/main/av_stream',
    subStream: process.env.CAMERA_SUB_STREAM || '/h264/ch1/sub/av_stream'
  }
};

const getCamConfig = (cameraId = 'sparsh-cam2') => {
  if (CAMERAS[cameraId]) return CAMERAS[cameraId];
  const clean = String(cameraId).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.includes('p02') || clean.includes('pole2') || clean.endsWith('2') || clean === '2' || clean.includes('108') || clean.includes('main')) {
    return CAMERAS['sparsh-main'];
  }
  return CAMERAS['sparsh-cam2'];
};

const IDLE_TIMEOUT_SEC = parseInt(process.env.CAMERA_SESSION_IDLE_TIMEOUT || '60', 10);

// Session State Store
const activeSessions = new Map();
let socket = null;
let heartbeatInterval = null;

/**
 * Sanitize strings to remove passwords before logging
 */
const sanitizeLog = (str) => {
  if (typeof str !== 'string') return str;
  let res = str;
  for (const key of Object.keys(CAMERAS)) {
    const p = CAMERAS[key].pass;
    if (p && p.length > 0) {
      res = res.replace(new RegExp(encodeURIComponent(p), 'g'), '****')
               .replace(new RegExp(p, 'g'), '****');
    }
  }
  return res;
};

const safeLog = (...args) => {
  const sanitizedArgs = args.map(a => typeof a === 'string' ? sanitizeLog(a) : a);
  console.log(`[Edge Agent ${EDGE_ID}]`, ...sanitizedArgs);
};

/**
 * Register Edge Agent with E3DI Cloud Backend
 */
const registerWithCloud = async () => {
  safeLog(`Registering Edge Agent with cloud at ${CLOUD_URL}...`);
  try {
    const res = await axios.post(`${CLOUD_URL}/api/admin/edges/register`, {
      edgeId: EDGE_ID,
      siteId: SITE_ID,
      name: AGENT_NAME,
      agentVersion: AGENT_VERSION,
      localIp: `${CAMERAS['sparsh-main'].host}, ${CAMERAS['sparsh-cam2'].host}`
    });
    safeLog('✅ Registered successfully with cloud:', res.data.status);
    return true;
  } catch (err) {
    safeLog('❌ Registration error:', err.message);
    return false;
  }
};

/**
 * Collect system telemetry and send heartbeat
 */
const sendHeartbeat = async () => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const uptime = Math.floor(process.uptime());

    const telemetry = {
      edgeId: EDGE_ID,
      siteId: SITE_ID,
      cpuUsage: Math.round(cpu.currentLoad || 0),
      memoryUsage: Math.round(((mem.active || 0) / (mem.total || 1)) * 100),
      activeStreams: activeSessions.size,
      cameraStatus: 'online',
      uptime
    };

    if (socket && socket.connected) {
      socket.emit('EDGE_HEARTBEAT', telemetry);
    }

    await axios.post(`${CLOUD_URL}/api/edges/${EDGE_ID}/heartbeat`, telemetry).catch(() => {});
  } catch (err) {
    safeLog('Heartbeat error:', err.message);
  }
};

/**
 * Construct local RTSP URL safely on the Edge
 */
const getLocalRtspUrl = (cameraId = 'sparsh-main', streamType = 'main') => {
  const cfg = getCamConfig(cameraId);
  const auth = cfg.user && cfg.pass ? `${encodeURIComponent(cfg.user)}:${encodeURIComponent(cfg.pass)}@` : (cfg.user ? `${encodeURIComponent(cfg.user)}:@` : '');
  const streamPath = streamType === 'sub' ? cfg.subStream : cfg.mainStream;
  return `rtsp://${auth}${cfg.host}:${cfg.port}${streamPath.startsWith('/') ? '' : '/'}${streamPath}`;
};

/**
 * Test LAN connectivity to local camera IP & port
 */
const checkCameraLanReachability = (cameraId = 'sparsh-main') => {
  const cfg = getCamConfig(cameraId);
  return new Promise((resolve) => {
    const conn = net.createConnection({ host: cfg.host, port: parseInt(cfg.port, 10), timeout: 3000 }, () => {
      conn.end();
      resolve({ success: true });
    });

    conn.on('error', (err) => {
      resolve({ success: false, code: 'CAMERA_UNREACHABLE', message: `Cannot connect to camera ${cameraId} at ${cfg.host}:${cfg.port} (${err.message})` });
    });

    conn.on('timeout', () => {
      conn.destroy();
      resolve({ success: false, code: 'CAMERA_UNREACHABLE', message: `Connection timeout to camera ${cameraId} at ${cfg.host}:${cfg.port}` });
    });
  });
};

/**
 * Start live camera session on local LAN
 */
const STREAMS_DIR = path.join(__dirname, 'streams');
const BACKEND_STREAMS_DIR = path.join(__dirname, '..', 'backend', 'uploads', 'cctv_streams');

const readWithRetry = async (filePath, retries = 3, delay = 50) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (!fs.existsSync(filePath)) return null;
      const buf = fs.readFileSync(filePath);
      if (buf && buf.length > 0) return buf;
    } catch (err) {
      if (i === retries - 1) return null;
      await new Promise(r => setTimeout(r, delay));
    }
    await new Promise(r => setTimeout(r, delay));
  }
  return null;
};

const sendFileToCloud = async (cameraId, filename, filePath) => {
  if (!filename || filename.endsWith('.tmp')) return;
  if (!fs.existsSync(filePath)) return;

  try {
    // 1. If backend streams folder exists on the same host, mirror directly with zero latency
    try {
      const backendCamDir = path.join(BACKEND_STREAMS_DIR, cameraId);
      if (fs.existsSync(BACKEND_STREAMS_DIR)) {
        if (!fs.existsSync(backendCamDir)) {
          fs.mkdirSync(backendCamDir, { recursive: true });
        }
        const destPath = path.join(backendCamDir, filename);
        const tmpDestPath = path.join(backendCamDir, `${filename}.tmp`);
        fs.copyFileSync(filePath, tmpDestPath);
        fs.renameSync(tmpDestPath, destPath);

        // If manifest was copied, clean up rolled-out segments
        if (filename.endsWith('.m3u8')) {
          try {
            const m3u8Content = fs.readFileSync(destPath, 'utf8');
            const activeTs = new Set(m3u8Content.match(/[\w-]+\.ts/g) || []);
            const files = fs.readdirSync(backendCamDir);
            for (const f of files) {
              if (f.endsWith('.ts') && !activeTs.has(f)) {
                try { fs.unlinkSync(path.join(backendCamDir, f)); } catch (e) {}
              }
            }
          } catch (e) {}
        }
      }
    } catch (localCopyErr) {}

    // 2. Read file safely with retry (avoiding transient Windows file lock contention)
    const fileBuf = await readWithRetry(filePath);
    if (!fileBuf || fileBuf.length === 0) return;

    // 3. Sync to cloud (WSS for playlist manifest, HTTP raw POST for TS segments)
    if (filename.endsWith('.m3u8')) {
      if (socket && socket.connected) {
        socket.emit('HLS_SEGMENT_SYNC', {
          edgeId: EDGE_ID,
          cameraId,
          filename,
          contentBase64: fileBuf.toString('base64')
        });
      }
    } else {
      await axios.post(`${CLOUD_URL}/api/edges/upload-segment`, fileBuf, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'x-edge-id': EDGE_ID,
          'x-camera-id': cameraId,
          'x-filename': filename
        },
        timeout: 5000
      }).catch(err => {
        if (socket && socket.connected) {
          socket.emit('HLS_SEGMENT_SYNC', {
            edgeId: EDGE_ID,
            cameraId,
            filename,
            contentBase64: fileBuf.toString('base64')
          });
        }
      });
    }
  } catch (e) {}
};

// Persistent Warm RTSP Media Sources Map
const warmMediaSources = new Map();

/**
 * Pre-warm and maintain persistent camera RTSP stream
 */
const ensureWarmCameraStream = async (cameraId = 'sparsh-main', streamType = 'main') => {
  if (warmMediaSources.has(cameraId)) {
    const warm = warmMediaSources.get(cameraId);
    if (warm.process && !warm.process.killed) {
      return { success: true, warm };
    }
  }

  safeLog(`🔥 Pre-warming persistent camera RTSP stream for ${cameraId}...`);
  const reachability = await checkCameraLanReachability(cameraId);
  if (!reachability.success) {
    safeLog(`❌ Warm stream init failed for ${cameraId}: ${reachability.message}`);
    return { success: false, code: reachability.code, message: reachability.message };
  }

  const rtspUrl = getLocalRtspUrl(cameraId, streamType);
  const camDir = path.join(STREAMS_DIR, cameraId);
  if (!fs.existsSync(camDir)) {
    fs.mkdirSync(camDir, { recursive: true });
  }

  const manifestPath = path.join(camDir, 'index.m3u8');

  const ffmpegArgs = [
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-vf', 'scale=1280:720,format=yuv420p',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    '-tune', 'zerolatency',
    '-g', '50',
    '-sc_threshold', '0',
    '-b:v', '2000k',
    '-maxrate', '2500k',
    '-bufsize', '5000k',
    '-c:a', 'aac',
    '-ar', '48000',
    '-b:a', '128k',
    '-f', 'hls',
    '-hls_time', '2',
    '-hls_list_size', '30',
    '-hls_flags', 'temp_file+delete_segments+independent_segments',
    '-hls_segment_type', 'mpegts',
    manifestPath
  ];

  safeLog(`🎥 Spawning persistent FFmpeg RTSP process for ${cameraId}...`);
  const ffProcess = spawn(ffmpegBin, ffmpegArgs, {
    stdio: ['ignore', 'ignore', 'pipe']
  });

  // CRITICAL: Continuously drain stderr pipe so FFmpeg never blocks or deadlocks!
  ffProcess.stderr.on('data', (data) => {
    const msg = data.toString();
    if (msg.includes('Error') || msg.includes('Connection refused') || msg.includes('401 Unauthorized')) {
      safeLog(`[FFmpeg ${cameraId} ERR] ${msg.trim()}`);
    }
  });

  let dirWatcher = null;
  try {
    dirWatcher = fs.watch(camDir, (eventType, filename) => {
      if (filename && !filename.endsWith('.tmp') && (filename.endsWith('.m3u8') || filename.endsWith('.ts'))) {
        const filePath = path.join(camDir, filename);
        sendFileToCloud(cameraId, filename, filePath);
      }
    });
  } catch (e) {}

  // Periodic safety sync interval in case Windows fs.watch misses a file rename
  const pollInterval = setInterval(() => {
    try {
      if (!fs.existsSync(camDir)) return;
      const files = fs.readdirSync(camDir);
      for (const f of files) {
        if (!f.endsWith('.tmp') && (f.endsWith('.m3u8') || f.endsWith('.ts'))) {
          sendFileToCloud(cameraId, f, path.join(camDir, f));
        }
      }
    } catch (e) {}
  }, 1000);

  const warmObj = {
    cameraId,
    process: ffProcess,
    dirWatcher,
    pollInterval,
    camDir,
    startedAt: Date.now(),
    status: 'READY'
  };

  ffProcess.on('exit', (code) => {
    safeLog(`⚠️ Warm FFmpeg process for ${cameraId} exited with code ${code}. Auto-restarting in 2s...`);
    warmMediaSources.delete(cameraId);
    if (dirWatcher) { try { dirWatcher.close(); } catch (e) {} }
    if (pollInterval) { try { clearInterval(pollInterval); } catch (e) {} }
    setTimeout(() => { ensureWarmCameraStream(cameraId, streamType); }, 2000);
  });

  warmMediaSources.set(cameraId, warmObj);
  return { success: true, warm: warmObj };
};

/**
 * Start live camera viewer session
 */
const startCameraSession = async (sessionId, cameraId, streamType = 'main') => {
  if (activeSessions.has(sessionId)) {
    safeLog(`Viewer session ${sessionId} already active.`);
    return;
  }

  // Instantly attach to pre-warmed RTSP media source (<50ms)
  const warmResult = await ensureWarmCameraStream(cameraId, streamType);
  if (!warmResult.success) {
    if (socket && socket.connected) {
      socket.emit('CAMERA_SESSION_STATUS', {
        sessionId,
        status: 'FAILED',
        error: warmResult.code,
        message: warmResult.message
      });
    }
    return;
  }

  safeLog(`⚡ Viewer session ${sessionId} attaching to warm media stream ${cameraId}...`);

  const session = {
    sessionId,
    cameraId,
    startTime: Date.now(),
    lastActivity: Date.now(),
    idleTimer: null,
    pc: null
  };

  session.idleTimer = setInterval(() => {
    const idleSeconds = (Date.now() - session.lastActivity) / 1000;
    if (idleSeconds > IDLE_TIMEOUT_SEC) {
      safeLog(`⏱️ Viewer session ${sessionId} idle for ${Math.round(idleSeconds)}s — closing viewer session`);
      stopCameraSession(sessionId);
    }
  }, 10000);

  activeSessions.set(sessionId, session);

  if (socket && socket.connected) {
    socket.emit('CAMERA_SESSION_STATUS', {
      sessionId,
      status: 'LIVE',
      metadata: { webrtcSupported: true, streamType }
    });
  }
};

/**
 * Stop live camera viewer session (warm RTSP source remains active)
 */
const stopCameraSession = (sessionId) => {
  const session = activeSessions.get(sessionId);
  if (session) {
    if (session.idleTimer) clearInterval(session.idleTimer);
    if (session.pc) {
      try { session.pc.close(); } catch (e) {}
    }
    activeSessions.delete(sessionId);
    safeLog(`🛑 Stopped viewer session ${sessionId} (warm RTSP source remains ACTIVE)`);

    if (socket && socket.connected) {
      socket.emit('CAMERA_SESSION_STATUS', { sessionId, status: 'STOPPED' });
    }
  }
};

const RECORDINGS_DIR = path.join(__dirname, 'recordings');
const activeRecordings = new Map();

const formatDateStr = (dateObj) => {
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const formatTimeStr = (dateObj) => {
  const hh = String(dateObj.getHours()).padStart(2, '0');
  const mm = String(dateObj.getMinutes()).padStart(2, '0');
  const ss = String(dateObj.getSeconds()).padStart(2, '0');
  return `${hh}-${mm}-${ss}`;
};

/**
 * Start independent camera recording on Edge Agent
 */
const startCameraRecording = async (recordingId, cameraId, scheduledStopAtMs) => {
  if (activeRecordings.has(recordingId)) {
    safeLog(`Recording ${recordingId} already active.`);
    return;
  }

  safeLog(`🎥 Starting independent camera recording for ${cameraId} (recordingId: ${recordingId})...`);
  const rtspUrl = getLocalRtspUrl(cameraId, 'main');
  const now = new Date();
  const dateFolder = formatDateStr(now);
  const startTimeStr = formatTimeStr(now);
  const stopDateObj = new Date(scheduledStopAtMs);
  const stopTimeStr = formatTimeStr(stopDateObj);

  const recDir = path.join(RECORDINGS_DIR, SITE_ID, cameraId, dateFolder);
  if (!fs.existsSync(recDir)) {
    fs.mkdirSync(recDir, { recursive: true });
  }

  const fileName = `${cameraId}_${dateFolder}_${startTimeStr}_to_${stopTimeStr}.mp4`;
  const filePath = path.join(recDir, fileName);

  const ffmpegArgs = [
    '-rtsp_transport', 'tcp',
    '-i', rtspUrl,
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-vf', 'scale=1280:720,format=yuv420p',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-tune', 'zerolatency',
    '-c:a', 'aac',
    '-ar', '48000',
    '-b:a', '128k',
    '-movflags', '+faststart+frag_keyframe+empty_moov',
    '-y',
    filePath
  ];

  safeLog(`📹 Spawning FFmpeg recording process -> ${filePath}`);
  const recProcess = spawn(ffmpegBin, ffmpegArgs);

  const durationMs = scheduledStopAtMs - Date.now();
  safeLog(`⏱️ Scheduled recording stop in ${Math.round(durationMs / 1000)}s (at ${stopDateObj.toLocaleTimeString()})...`);

  const stopTimer = setTimeout(() => {
    safeLog(`⏰ Scheduled stop time ${stopDateObj.toLocaleTimeString()} reached for recording ${recordingId}! Finalizing...`);
    stopCameraRecording(recordingId);
  }, Math.max(1000, durationMs));

  const recData = {
    recordingId,
    cameraId,
    siteId: SITE_ID,
    edgeId: EDGE_ID,
    startedAt: now.toISOString(),
    scheduledStopAt: stopDateObj.toISOString(),
    filePath,
    process: recProcess,
    stopTimer
  };

  activeRecordings.set(recordingId, recData);

  if (socket && socket.connected) {
    socket.emit('RECORDING_STATUS', {
      recordingId,
      cameraId,
      status: 'recording',
      startedAt: now.toISOString(),
      scheduledStopAt: stopDateObj.toISOString(),
      filePath
    });
  }
};

/**
 * Stop independent camera recording on Edge Agent
 */
const stopCameraRecording = (recordingId) => {
  const recData = activeRecordings.get(recordingId);
  if (recData) {
    if (recData.stopTimer) clearTimeout(recData.stopTimer);
    if (recData.process) {
      try { recData.process.kill('SIGINT'); } catch (e) {}
    }

    const endedAt = new Date().toISOString();
    const durationSeconds = Math.round((Date.now() - new Date(recData.startedAt).getTime()) / 1000);
    safeLog(`✅ Finalized recording ${recordingId} (${durationSeconds}s duration) -> ${recData.filePath}`);

    activeRecordings.delete(recordingId);

    if (socket && socket.connected) {
      socket.emit('RECORDING_STATUS', {
        recordingId,
        cameraId: recData.cameraId,
        status: 'completed',
        startedAt: recData.startedAt,
        endedAt,
        durationSeconds,
        filePath: recData.filePath
      });
    }
  }
};

/**
 * Initialize Outbound Persistent WSS Connection
 */
const connectWebSocket = () => {
  safeLog(`Connecting outbound WSS to ${CLOUD_URL}...`);

  socket = io(CLOUD_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: Infinity
  });

  socket.on('connect', () => {
    safeLog('🔌 Outbound WSS connected to E3DI Cloud. Socket ID:', socket.id);
    socket.emit('REGISTER_EDGE', { edgeId: EDGE_ID, siteId: SITE_ID });
    ensureWarmCameraStream('sparsh-main');
    ensureWarmCameraStream('sparsh-cam2');
  });

  socket.on('START_CAMERA_SESSION', ({ sessionId, cameraId, stream }) => {
    safeLog(`Received START_CAMERA_SESSION: sessionId=${sessionId}, cameraId=${cameraId}`);
    startCameraSession(sessionId, cameraId, stream);
  });

  socket.on('STOP_CAMERA_SESSION', ({ sessionId }) => {
    safeLog(`Received STOP_CAMERA_SESSION for session ${sessionId}`);
    stopCameraSession(sessionId);
  });

  socket.on('START_RECORDING', ({ recordingId, cameraId, scheduledStopAtMs }) => {
    safeLog(`Received START_RECORDING: recordingId=${recordingId}, cameraId=${cameraId}, scheduledStopAt=${new Date(scheduledStopAtMs).toLocaleTimeString()}`);
    startCameraRecording(recordingId, cameraId, scheduledStopAtMs);
  });

  socket.on('STOP_RECORDING', ({ recordingId }) => {
    safeLog(`Received STOP_RECORDING for recording ${recordingId}`);
    stopCameraRecording(recordingId);
  });

  socket.on('WEBRTC_SIGNAL', ({ sessionId, signal }) => {
    if (!sessionId || !signal) return;
    const session = activeSessions.get(sessionId);
    if (!session) return;
    session.lastActivity = Date.now();

    try {
      const nodeDataChannel = require('node-datachannel');
      if (signal.type === 'sdp' || (signal.sdp && !signal.candidate)) {
        safeLog(`⚡ Processing WebRTC SDP Offer for session ${sessionId}...`);
        const pc = new nodeDataChannel.PeerConnection(sessionId, {
          iceServers: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302']
        });
        session.pc = pc;

        const videoMedia = new nodeDataChannel.Video('video', 'sendrecv');
        pc.addTrack(videoMedia);

        pc.onLocalDescription((sdp, type) => {
          safeLog(`✅ Generated WebRTC SDP ${type} for session ${sessionId}`);
          if (socket && socket.connected) {
            socket.emit('WEBRTC_SIGNAL_RESPONSE', {
              sessionId,
              signal: { type: 'answer', sdp }
            });
          }
        });

        pc.onLocalCandidate((candidate, mid) => {
          if (socket && socket.connected) {
            socket.emit('WEBRTC_SIGNAL_RESPONSE', {
              sessionId,
              signal: { type: 'candidate', candidate }
            });
          }
        });

        const offerSdpStr = typeof signal.sdp === 'string' ? signal.sdp : (signal.sdp?.sdp || signal.sdp);
        pc.setRemoteDescription(offerSdpStr, 'offer');
      } else if (signal.candidate && session.pc) {
        session.pc.addRemoteCandidate(signal.candidate.candidate || signal.candidate, signal.candidate.sdpMid || '0');
      }
    } catch (err) {
      safeLog(`⚠️ WebRTC Signaling processing warning: ${err.message}`);
    }
  });

  socket.on('disconnect', () => {
    safeLog('❌ Outbound WSS disconnected from E3DI Cloud. Retrying...');
  });
};

/**
 * Main Application Entry Point
 */
const main = async () => {
  safeLog('====================================================');
  safeLog(`E3DI Edge Agent Daemon v${AGENT_VERSION}`);
  safeLog(`Site ID: ${SITE_ID} | Edge ID: ${EDGE_ID}`);
  safeLog(`Cloud Server URL: ${CLOUD_URL}`);
  safeLog(`Camera 1 (sparsh-main): ${CAMERAS['sparsh-main'].host}:${CAMERAS['sparsh-main'].port}`);
  safeLog(`Camera 2 (sparsh-cam2): ${CAMERAS['sparsh-cam2'].host}:${CAMERAS['sparsh-cam2'].port}`);
  safeLog('====================================================');

  await registerWithCloud();
  connectWebSocket();

  // Send periodic telemetry heartbeat every 15 seconds
  heartbeatInterval = setInterval(sendHeartbeat, 15000);
  sendHeartbeat();
};

main().catch((err) => safeLog('Fatal Edge Agent error:', err.message));
