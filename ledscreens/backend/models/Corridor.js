const mongoose = require('mongoose');

const CorridorSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  city: { type: String, default: 'Vijayawada' },
  area: { type: String, default: 'MG Road' },
  pricePer5Sec: { type: Number, required: true, default: 10, min: 1 },
  pricePer30Sec: { type: Number, default: 50 },
  pricePerScreen: { type: Number },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

CorridorSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.models.Corridor || mongoose.model('Corridor', CorridorSchema);
