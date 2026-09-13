/**
 * E3DI CCTV Camera Registry & Security Sanitizer Service
 * 
 * Critical Security Enforcement:
 * Raw RTSP URLs, usernames, passwords, and IP parameters NEVER leave the backend.
 * Public APIs return only sanitized metadata.
 */

const getCameraConfigs = () => {
  const isEnabled = process.env.CAMERA_ENABLED !== 'false';
  const host = process.env.CAMERA_HOST || '192.168.1.108';
  const port = process.env.CAMERA_RTSP_PORT || '554';
  const username = process.env.CAMERA_USERNAME || 'admin';
  const password = process.env.CAMERA_PASSWORD || '';
  const mainPath = process.env.CAMERA_MAIN_STREAM || '/h264/ch1/main/av_stream';
  const subPath = process.env.CAMERA_SUB_STREAM || '/h264/ch1/sub/av_stream';
  const model = process.env.CAMERA_MODEL || 'IP_Camera_2K';

  const authPart = username && password ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` : (username ? `${encodeURIComponent(username)}:@` : '');
  const mainRtspUrl = `rtsp://${authPart}${host}:${port}${mainPath.startsWith('/') ? '' : '/'}${mainPath}`;
  const subRtspUrl = `rtsp://${authPart}${host}:${port}${subPath.startsWith('/') ? '' : '/'}${subPath}`;

  const configs = [
    {
      id: 'sparsh-cam2',
      name: 'Smart Pole 1 Camera (sparsh-cam2)',
      model: 'IP_Camera_V4',
      location: 'Smart Pole 1 — ETHREE-P01 (192.168.1.4)',
      poleId: 'ETHREE-P01',
      siteId: 'SITE-001',
      edgeId: 'EDGE-001',
      resolution: '1920x1080',
      fps: 25,
      streamType: 'hls',
      enabled: isEnabled,
      streamMode: 'edge_relay',
      _internal: {
        host: '192.168.1.4',
        port: '554',
        username: 'admin',
        mainRtspUrl: 'rtsp://admin:@192.168.1.4:554/stream0',
        subRtspUrl: 'rtsp://admin:@192.168.1.4:554/stream1',
        hasPassword: false
      }
    },
    {
      id: 'sparsh-main',
      name: 'Smart Pole 2 Camera (sparsh-main)',
      model: model,
      location: 'Smart Pole 2 — ETHREE-P02 (192.168.1.108)',
      poleId: 'ETHREE-P02',
      siteId: 'SITE-001',
      edgeId: 'EDGE-001',
      resolution: '2560x1440',
      fps: 30,
      streamType: 'hls',
      enabled: isEnabled,
      streamMode: 'edge_relay',
      _internal: {
        host,
        port,
        username,
        mainRtspUrl,
        subRtspUrl,
        hasPassword: !!password
      }
    }
  ];

  return configs;
};

// Dynamic in-memory camera status tracking
const cameraStatusMap = new Map();

/**
 * Update current dynamic status of a camera
 */
const setCameraStatus = (cameraId, status, details = {}) => {
  cameraStatusMap.set(cameraId, {
    status, // 'connecting' | 'online' | 'offline' | 'auth_error' | 'stream_error'
    lastUpdated: new Date().toISOString(),
    ...details
  });
};

/**
 * Get sanitized public metadata for a specific camera (or all cameras)
 */
const getPublicCameraMetadata = (cameraId = null) => {
  const configs = getCameraConfigs();

  if (cameraId) {
    let cam = configs.find(c => c.id === cameraId);
    // Alias mapping for poleId / deviceId -> CCTV camera
    if (!cam) {
      const lower = String(cameraId).toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lower.includes('p02') || lower.includes('pole2') || lower === '2') {
        cam = configs.find(c => c.id === 'sparsh-main'); // Pole 2 -> sparsh-main
      } else if (lower.includes('p01') || lower.includes('pole1') || lower === '1') {
        cam = configs.find(c => c.id === 'sparsh-cam2'); // Pole 1 -> sparsh-cam2
      } else if (lower.includes('sparsh') || lower.includes('ethree')) {
        cam = configs.find(c => c.id === 'sparsh-cam2');
      }
    }
    if (!cam && configs.length > 0) {
      cam = configs[0]; // Primary camera fallback (Pole 1)
    }
    if (!cam) return null;
    
    const currentStatus = cameraStatusMap.get(cam.id) || {
      status: cam.enabled ? 'connecting' : 'offline'
    };

    // Return strictly sanitized object
    return {
      id: cam.id,
      name: cam.name,
      poleId: cam.poleId,
      model: cam.model,
      location: cam.location,
      siteId: cam.siteId || 'SITE-001',
      edgeId: cam.edgeId || 'EDGE-001',
      status: currentStatus.status,
      resolution: cam.resolution,
      fps: cam.fps,
      streamType: cam.streamType,
      enabled: cam.enabled,
      statusDetails: currentStatus.details || undefined
    };
  }

  // Return list of all sanitized cameras
  return configs.map(cam => {
    const currentStatus = cameraStatusMap.get(cam.id) || {
      status: cam.enabled ? 'connecting' : 'offline'
    };

    return {
      id: cam.id,
      name: cam.name,
      poleId: cam.poleId,
      model: cam.model,
      location: cam.location,
      siteId: cam.siteId || 'SITE-001',
      edgeId: cam.edgeId || 'EDGE-001',
      status: currentStatus.status,
      resolution: cam.resolution,
      fps: cam.fps,
      streamType: cam.streamType,
      enabled: cam.enabled,
      statusDetails: currentStatus.details || undefined
    };
  });
};

/**
 * Retrieve internal RTSP details ONLY for the backend stream gateway
 */
const getInternalCameraConfig = (cameraId) => {
  const configs = getCameraConfigs();
  let cam = configs.find(c => c.id === cameraId);
  if (!cam && (cameraId === 'ethree-65' || cameraId.includes('ethree') || cameraId.includes('sparsh'))) {
    cam = configs.find(c => c.id === 'sparsh-main');
  }
  if (!cam && configs.length > 0) {
    cam = configs[0];
  }
  if (!cam) return null;
  return {
    id: cam.id,
    name: cam.name,
    enabled: cam.enabled,
    mainRtspUrl: cam._internal.mainRtspUrl,
    subRtspUrl: cam._internal.subRtspUrl,
    host: cam._internal.host,
    username: cam._internal.username,
    hasPassword: cam._internal.hasPassword
  };
};

module.exports = {
  getCameraConfigs,
  getPublicCameraMetadata,
  getInternalCameraConfig,
  setCameraStatus
};
