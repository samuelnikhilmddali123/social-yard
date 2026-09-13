const mongoose = require('mongoose');

const SosAlertSchema = new mongoose.Schema({
  device: { type: String, required: true, default: 'ESP32-SOS-01' },
  location: { type: String, default: 'Vijayawada MG Road Corridor' },
  poleId: { type: String, default: '' },
  screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', default: null },
  status: { type: String, default: 'Active Emergency' },
  battery: { type: Number, default: 100 },
  ipAddress: { type: String, default: '' },
  resolved: { type: Boolean, default: false },
  resolvedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.SosAlert || mongoose.model('SosAlert', SosAlertSchema);
