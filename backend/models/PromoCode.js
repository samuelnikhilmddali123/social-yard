const mongoose = require('mongoose');

const PromoCodeSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true, 
    uppercase: true, 
    trim: true,
    index: true 
  },
  status: { 
    type: String, 
    enum: ['ACTIVE', 'USED'], 
    default: 'ACTIVE',
    index: true 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  usedAt: { 
    type: Date, 
    default: null 
  },
  usedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  },
  type: {
    type: String,
    enum: ['SYSTEM', 'SOCIAL_ADS'],
    default: 'SYSTEM',
    index: true
  },
  createdByName: {
    type: String,
    default: 'System Admin'
  },
  createdByEmail: {
    type: String,
    default: 'admin@jaan.com'
  },
  createdById: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
});

module.exports = mongoose.models.PromoCode || mongoose.model('PromoCode', PromoCodeSchema);
