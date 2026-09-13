/**
 * E3DI Camera Registry Database Model
 * Binds cameras to siteId and edgeId with safe metadata.
 * 
 * Security Rule: Camera credentials (passwords, usernames, RTSP URLs) are NEVER stored in this schema.
 */

const mongoose = require('mongoose');

const CameraSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  siteId: { type: String, required: true },
  edgeId: { type: String, required: true },
  name: { type: String, required: true },
  vendor: { type: String, default: 'Sparsh' },
  model: { type: String, default: 'SC-INA50B-3P25' },
  resolution: { type: String, default: '1920x1080' },
  fps: { type: Number, default: 25 },
  streamType: { type: String, default: 'webrtc' },
  enabled: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Camera || mongoose.model('Camera', CameraSchema);
