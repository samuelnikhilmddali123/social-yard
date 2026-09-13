const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  deviceId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['online', 'offline', 'maintenance', 'active'], default: 'offline' },
  lat: { type: Number, default: 16.5062 }, 
  lng: { type: Number, default: 80.6480 },
  
  // New Administrative Fields
  corridorName: { type: String, default: 'Vijayawada MG Road Corridor' },
  city: { type: String, default: 'Vijayawada' },
  area: { type: String, default: 'MG Road' },
  poleId: { type: String, default: '' },
  poleType: { type: String, enum: ['Single Pole', 'Dual-Sided Divider Pole'], default: 'Dual-Sided Divider Pole' },
  
  // Targeting Details
  side: { type: String, enum: ['A', 'B', 'none'], default: 'none' },
  facingLocation: { type: String, default: '' }, // e.g. "Ambedkar Statue Side"
  orientation: { type: String, default: '' }, // e.g. "Facing East"
  
  // Physical Details
  resolution: { type: String, default: '1920x1080' },
  width: { type: String, default: '10ft' },
  height: { type: String, default: '10ft' },
  
  // Device Connection & Multi-Router CCTV
  deviceType: { type: String, enum: ['Android Player', 'Smart TV', 'Raspberry Pi', 'Web Player'], default: 'Android Player' },
  cameraStreamUrl: { type: String, default: '' },
  cctvCameraId: { type: String, default: '' },
  cctvStreamMode: { type: String, enum: ['edge_relay', 'rtsp_tunnel', 'direct'], default: 'edge_relay' },
  cctvLocalIp: { type: String, default: '192.168.1.108' },
  cctvRtspUrl: { type: String, default: '' },
  lastCctvHeartbeat: { type: Date, default: Date.now },
  playbackUrl: { type: String, default: '' },
  healthStatus: { type: String, default: 'Healthy' },
  
  // Audio Control (admin-controlled remotely)
  soundEnabled: { type: Boolean, default: false },
  volume: { type: Number, default: 50, min: 0, max: 100 },

  // K100C Bluetooth / ESP32 Controller Cloud Bridge
  k100cState: {
    power: { type: Boolean, default: true },
    brightness: { type: Number, default: 100, min: 0, max: 100 },
    mode: { type: String, default: 'normal' },
    bleConnected: { type: Boolean, default: false },
    lastCommand: { type: String, default: '' },
    lastCommandAt: { type: Date, default: null },
    lastHeartbeat: { type: Date, default: null }
  },
  
  // Legacy/Internal
  domain: { type: String, default: '' },
  streamType: { type: String, enum: ['rtsp', 'hls', 'mjpeg', ''], default: '' },
  accessType: { type: String, enum: ['public', 'government'], default: 'public' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Screen || mongoose.model('Screen', ScreenSchema);
