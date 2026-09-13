const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  screenId: { type: mongoose.Schema.Types.ObjectId, ref: 'Screen', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bookedByName: { type: String },
  bookedByPhone: { type: String },
  bookedByEmail: { type: String },
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  startTime: { type: String, required: true }, // Format: HH:mm
  endTime: { type: String, required: true }, // Format: HH:mm
  isInstant: { type: Boolean, default: false },
  duration: { type: Number }, // In minutes
  durationSeconds: { type: Number }, // In seconds
  slotMultiplier: { type: Number }, // Math.ceil(durationSeconds / 5)
  durationMultiplier: { type: Number }, // Fallback
  selectedScreens: { type: Number }, // number of screens selected
  calculatedPrice: { type: Number }, // calculated price
  bookingGroupId: { type: String, index: true },
  corridorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Corridor' },
  corridorName: { type: String },
  pricePer5Sec: { type: Number },
  pricePer30Sec: { type: Number },
  pricePerScreen: { type: Number },
  selectedScreenCount: { type: Number },
  totalAmount: { type: Number },
  pricingBreakdown: { type: mongoose.Schema.Types.Mixed },
  hasWatermark: { type: Boolean, default: true },
  isFreeTrialBooking: { type: Boolean, default: false },
  appliedCoupon: { type: String },
  discountAmount: { type: Number, default: 0 },
  gst: { type: String },
  companyName: { type: String },
  status: { 
    type: String, 
    enum: ['pending_payment', 'pending', 'approved', 'rejected', 'upcoming', 'active', 'completed', 'revoked'], 
    default: 'pending' 
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  txnid: { type: String },
  easebuzzAccessKey: { type: String },
  approvedAt: { type: Date },
  rejectedAt: { type: Date },
  revokedAt: { type: Date },
  startedAt: { type: Date },
  completedAt: { type: Date },
  rejectionReason: { type: String },
  revokedReason: { type: String },
  revokedBy: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);
