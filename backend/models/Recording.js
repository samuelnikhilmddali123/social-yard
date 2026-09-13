const mongoose = require('mongoose');

const recordingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  cameraId: { type: String, required: true, index: true },
  siteId: { type: String, required: true, default: 'SITE-001' },
  edgeId: { type: String, required: true, default: 'EDGE-001' },
  mode: { type: String, default: 'manual' },
  startedAt: { type: Date, required: true },
  endedAt: { type: Date },
  scheduledStopAt: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  status: { type: String, enum: ['recording', 'stopping', 'completed', 'failed'], default: 'recording' },
  storagePath: { type: String },
  sizeBytes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Recording', recordingSchema);
