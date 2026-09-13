/**
 * E3DI Edge Manager & WSS Signaling Service
 * 
 * Manages persistent outbound WebSocket connections from Edge Agents.
 * Routes WebRTC signaling and camera session control commands between cloud and edge.
 */

const EdgeAgent = require('../models/EdgeAgent');

// Map of edgeId -> socket connection
const activeEdgeSockets = new Map();

// Map of sessionId -> { sessionId, cameraId, edgeId, status, startTime, lastPing, idleTimer }
const activeSessions = new Map();

/**
 * Register Edge Agent socket connection
 */
const registerEdgeSocket = (edgeId, socket) => {
  console.log(`[Edge Manager] 🔌 Edge Agent connected: ${edgeId}`);
  activeEdgeSockets.set(edgeId, socket);
};

/**
 * Unregister Edge Agent socket connection
 */
const unregisterEdgeSocket = (socketId) => {
  for (const [edgeId, socket] of activeEdgeSockets.entries()) {
    if (socket.id === socketId) {
      console.log(`[Edge Manager] ❌ Edge Agent disconnected: ${edgeId}`);
      activeEdgeSockets.delete(edgeId);
      // Mark edge as offline in database
      EdgeAgent.findOneAndUpdate({ edgeId }, { status: 'offline', lastSeen: new Date() }).catch(() => {});
      break;
    }
  }
};

/**
 * Get socket connection for a given edgeId
 */
const getEdgeSocket = (edgeId) => {
  return activeEdgeSockets.get(edgeId);
};

/**
 * Handle Edge Agent heartbeat and update telemetry status
 */
const handleEdgeHeartbeat = async (edgeId, telemetry = {}) => {
  if (!edgeId) return;
  try {
    const updateData = {
      status: 'online',
      lastSeen: new Date()
    };
    if (telemetry.uptime !== undefined) {
      updateData.uptime = telemetry.uptime;
    }

    const telemetryObj = {};
    if (telemetry.cpuUsage !== undefined) telemetryObj.cpuUsage = telemetry.cpuUsage;
    if (telemetry.memoryUsage !== undefined) telemetryObj.memoryUsage = telemetry.memoryUsage;
    if (telemetry.activeStreams !== undefined) telemetryObj.activeStreams = telemetry.activeStreams;
    if (telemetry.cameraStatus !== undefined) telemetryObj.cameraStatus = telemetry.cameraStatus;

    if (Object.keys(telemetryObj).length > 0) {
      updateData.telemetry = telemetryObj;
    }

    await EdgeAgent.findOneAndUpdate(
      { edgeId },
      { $set: updateData },
      { new: true, upsert: false }
    );
  } catch (err) {
    console.error(`[Edge Manager] Error processing heartbeat for ${edgeId}:`, err.message);
  }
};


const fs = require('fs');
const path = require('path');
const STREAMS_DIR = path.join(__dirname, '..', 'uploads', 'cctv_streams');

/**
 * Handle incoming HLS segment sync from Edge Agent over WebSocket
 */
const handleHlsSegmentSync = ({ cameraId, filename, contentBase64 }) => {
  if (!cameraId || !filename || !contentBase64) return;
  try {
    const camDir = path.join(STREAMS_DIR, cameraId);
    if (!fs.existsSync(camDir)) {
      fs.mkdirSync(camDir, { recursive: true });
    }
    const cleanName = path.basename(filename);
    const tmpPath = path.join(camDir, `${cleanName}.tmp`);
    const finalPath = path.join(camDir, cleanName);

    fs.writeFileSync(tmpPath, Buffer.from(contentBase64, 'base64'));
    fs.renameSync(tmpPath, finalPath);

    // If updating manifest, clean up old segments that fell out of the live playlist
    if (cleanName.endsWith('.m3u8')) {
      try {
        const m3u8Content = Buffer.from(contentBase64, 'base64').toString('utf8');
        const activeTs = new Set(m3u8Content.match(/[\w-]+\.ts/g) || []);
        const files = fs.readdirSync(camDir);
        for (const f of files) {
          if (f.endsWith('.ts') && !activeTs.has(f)) {
            try { fs.unlinkSync(path.join(camDir, f)); } catch (e) {}
          }
        }
      } catch (cleanErr) {}
    }
  } catch (err) {
    console.error(`[Edge Manager] Error writing synced segment ${filename}:`, err.message);
  }
};

/**
 * Start camera session by sending WSS command to Edge Agent and awaiting ACK
 */
const startCameraSessionPromise = (sessionId, cameraId, edgeId, siteId, streamType = 'main') => {
  return new Promise((resolve) => {
    const socket = activeEdgeSockets.get(edgeId);
    if (!socket) {
      return resolve({
        success: false,
        error: 'EDGE_OFFLINE',
        message: `The camera gateway ${edgeId} for site ${siteId} is offline.`
      });
    }

    const sessionData = {
      sessionId,
      cameraId,
      edgeId,
      siteId,
      status: 'STARTING',
      startTime: Date.now(),
      lastPing: Date.now()
    };

    activeSessions.set(sessionId, sessionData);

    const timeout = setTimeout(() => {
      console.warn(`[CCTV] EDGE_RESPONSE=TIMEOUT (session ${sessionId})`);
      resolve({
        success: false,
        error: 'EDGE_COMMAND_TIMEOUT',
        message: `Edge Agent ${edgeId} did not respond to session start command within 5 seconds.`
      });
    }, 5000);

    const onStatusUpdate = (data) => {
      if (data && data.sessionId === sessionId) {
        if (data.status === 'LIVE' || data.status === 'CAMERA_SESSION_STARTED') {
          clearTimeout(timeout);
          socket.off('CAMERA_SESSION_STATUS', onStatusUpdate);
          console.log(`[CCTV] EDGE_RESPONSE=CAMERA_SESSION_STARTED (session ${sessionId})`);
          resolve({ success: true, session: sessionData });
        } else if (data.status === 'FAILED' || data.status === 'CAMERA_SESSION_FAILED') {
          clearTimeout(timeout);
          socket.off('CAMERA_SESSION_STATUS', onStatusUpdate);
          console.warn(`[CCTV] EDGE_RESPONSE=CAMERA_SESSION_FAILED (code: ${data.error || 'CAMERA_UNREACHABLE'})`);
          resolve({
            success: false,
            error: data.error || 'CAMERA_UNREACHABLE',
            message: data.message || `Edge Agent could not connect to camera at local LAN.`
          });
        }
      }
    };

    socket.on('CAMERA_SESSION_STATUS', onStatusUpdate);

    // Emit command to Edge Agent
    console.log(`[CCTV] EDGE_COMMAND_SENT -> ${edgeId}: START_CAMERA_SESSION (session ${sessionId})`);
    socket.emit('START_CAMERA_SESSION', {
      sessionId,
      cameraId,
      stream: streamType
    });
  });
};

const startCameraSession = (sessionId, cameraId, edgeId, siteId, streamType = 'main') => {
  return startCameraSessionPromise(sessionId, cameraId, edgeId, siteId, streamType);
};

/**
 * Independent Edge Recording Management
 */
const activeEdgeRecordings = new Map();

const startRecordingOnEdge = (recordingId, cameraId, edgeId, siteId, scheduledStopAtMs) => {
  const socket = activeEdgeSockets.get(edgeId);
  if (!socket) {
    return { success: false, error: 'EDGE_OFFLINE', message: `Edge Agent ${edgeId} is offline.` };
  }

  const recMeta = {
    recordingId,
    cameraId,
    edgeId,
    siteId,
    startedAt: new Date().toISOString(),
    scheduledStopAt: new Date(scheduledStopAtMs).toISOString(),
    status: 'recording'
  };

  activeEdgeRecordings.set(recordingId, recMeta);

  socket.emit('START_RECORDING', {
    recordingId,
    cameraId,
    scheduledStopAtMs
  });

  return { success: true, recording: recMeta };
};

const stopRecordingOnEdge = (recordingId) => {
  const rec = activeEdgeRecordings.get(recordingId);
  if (rec) {
    const socket = activeEdgeSockets.get(rec.edgeId);
    if (socket) {
      socket.emit('STOP_RECORDING', { recordingId });
    }
    rec.status = 'stopping';
    return { success: true };
  }
  return { success: false, error: 'RECORDING_NOT_FOUND' };
};

/**
 * Stop camera session
 */
const stopCameraSession = (sessionId) => {
  const session = activeSessions.get(sessionId);
  if (session) {
    const socket = activeEdgeSockets.get(session.edgeId);
    if (socket) {
      socket.emit('STOP_CAMERA_SESSION', { sessionId, cameraId: session.cameraId });
    }
    activeSessions.delete(sessionId);
    return { success: true };
  }
  return { success: false, error: 'SESSION_NOT_FOUND' };
};

/**
 * Route WebRTC signal (SDP offer/answer, ICE candidates) between frontend and Edge Agent
 */
const forwardSignal = (sessionId, signalData) => {
  const session = activeSessions.get(sessionId);
  if (!session) return false;

  const socket = activeEdgeSockets.get(session.edgeId);
  if (!socket) return false;

  socket.emit('WEBRTC_SIGNAL', { sessionId, signal: signalData });
  return true;
};

/**
 * Route SDP Offer to Edge Agent and await generated SDP Answer
 */
const forwardSignalPromise = (sessionId, signalData) => {
  return new Promise((resolve) => {
    const session = activeSessions.get(sessionId);
    if (!session) return resolve(null);

    const socket = activeEdgeSockets.get(session.edgeId);
    if (!socket) return resolve(null);

    const isOffer = signalData.type === 'sdp' || (signalData.sdp && !signalData.candidate);
    if (!isOffer) {
      socket.emit('WEBRTC_SIGNAL', { sessionId, signal: signalData });
      return resolve({ success: true });
    }

    const timeout = setTimeout(() => {
      resolve(null);
    }, 4000);

    const onSignalAnswer = (data) => {
      if (data && data.sessionId === sessionId && data.signal) {
        clearTimeout(timeout);
        socket.off('WEBRTC_SIGNAL_RESPONSE', onSignalAnswer);
        resolve(data.signal);
      }
    };

    socket.on('WEBRTC_SIGNAL_RESPONSE', onSignalAnswer);
    socket.emit('WEBRTC_SIGNAL', { sessionId, signal: signalData });
  });
};

/**
 * Update session status (e.g. CONNECTED, LIVE, DISCONNECTED, ERROR)
 */
const updateSessionStatus = (sessionId, status, metadata = {}) => {
  const session = activeSessions.get(sessionId);
  if (session) {
    session.status = status;
    session.lastPing = Date.now();
    if (metadata.webrtcInfo) {
      session.webrtcInfo = metadata.webrtcInfo;
    }
    if (status === 'STOPPED' || status === 'ERROR') {
      activeSessions.delete(sessionId);
    }
  }
};

/**
 * Get active session
 */
const getSession = (sessionId) => {
  return activeSessions.get(sessionId);
};

module.exports = {
  registerEdgeSocket,
  unregisterEdgeSocket,
  getEdgeSocket,
  handleEdgeHeartbeat,
  handleHlsSegmentSync,
  startCameraSession,
  stopCameraSession,
  startRecordingOnEdge,
  stopRecordingOnEdge,
  forwardSignal,
  forwardSignalPromise,
  updateSessionStatus,
  getSession,
  activeEdgeSockets,
  activeSessions,
  activeEdgeRecordings
};
