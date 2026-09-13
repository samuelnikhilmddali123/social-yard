const mongoose = require('mongoose');

const PromoUsageSchema = new mongoose.Schema({
  promoCode: { 
    type: String, 
    required: true,
    uppercase: true,
    index: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  phoneNumber: { 
    type: String, 
    required: true // Mandatory field per prompt requirements
  },
  email: { 
    type: String, 
    required: true 
  },
  orderId: { 
    type: String, 
    required: true 
  },
  discountAmount: { 
    type: Number, 
    required: true 
  },
  originalOrderAmount: { 
    type: Number, 
    required: true 
  },
  finalOrderAmount: { 
    type: Number, 
    default: 0 
  },
  usedAt: { 
    type: Date, 
    default: Date.now 
  },
  status: { 
    type: String, 
    default: 'USED' 
  },
  promoType: {
    type: String,
    enum: ['SYSTEM', 'SOCIAL_ADS'],
    default: 'SYSTEM'
  },
  generatedBy: {
    type: String,
    default: 'System Admin'
  }
});

module.exports = mongoose.models.PromoUsage || mongoose.model('PromoUsage', PromoUsageSchema);
