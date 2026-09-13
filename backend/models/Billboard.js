const mongoose = require('mongoose');

const BillboardSchema = new mongoose.Schema({
  location: { type: String, required: true },
  status: { type: String, enum: ['Active', 'High Demand'], default: 'Active' },
  price: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  image: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Billboard || mongoose.model('Billboard', BillboardSchema);
