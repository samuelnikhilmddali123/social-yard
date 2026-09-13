const mongoose = require('mongoose');

const PartnerRequestSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  companyName: { type: String },
  state: { type: String, required: true },
  city: { type: String, required: true },
  fullAddress: { type: String, required: true },
  landmark: { type: String },
  googleMapsLink: { type: String, required: true },
  totalScreens: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  resolution: { type: String },
  pixelPitch: { type: String },
  environment: { type: String },
  sideType: { type: String },
  mountType: { type: String },
  nearbyArea: { type: String },
  dailyTraffic: { type: String },
  facingDirection: { type: String },
  operatingHours: { type: String },
  internetAvailable: { type: String },
  remoteAccess: { type: String },
  powerBackup: { type: String },
  controlSystem: { type: String },
  mediaUrls: [{ type: String }],
  status: { type: String, enum: ['submitted', 'under_review', 'approved', 'rejected', 'onboarded'], default: 'submitted' },
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('PartnerRequest', PartnerRequestSchema);
