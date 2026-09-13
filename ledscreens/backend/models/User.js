const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin', 'government'], default: 'user' },
  phone: { type: String, default: '' },
  profilePic: { type: String, default: '' },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, default: '' },
  googleId: { type: String, default: '' },
  authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
  profileCompleted: { type: Boolean, default: false },
  companyName: { type: String, default: '' },
  gst: { type: String, default: '' },
  businessType: { type: String, default: '' },
  fcmTokens: [{ type: String }],
  hasUsedFreeTrial: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
