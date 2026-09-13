/**
 * E3DI Edge Agent Database Model
 * Stores registration and telemetry details for multi-site Edge Agents.
 */

const mongoose = require('mongoose');

const EdgeAgentSchema = new mongoose.Schema({
  edgeId: { type: String, required: true, unique: true },
  siteId: { type: String, required: true },
  name: { type: String, default: '' },
  agentVersion: { type: String, default: '1.0.0' },
  localIp: { type: String, default: '' },
  status: { type: String, enum: ['online', 'offline'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
  uptime: { type: Number, default: 0 },
  telemetry: {
    cpuUsage: { type: Number, default: 0 },
    memoryUsage: { type: Number, default: 0 },
    activeStreams: { type: Number, default: 0 },
    cameraStatus: { type: String, default: 'unknown' }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.EdgeAgent || mongoose.model('EdgeAgent', EdgeAgentSchema);
