const mongoose = require('mongoose');

const planSchema = new mongoose.Schema({
  name: { type: String, required: true },
  badge: { type: String, default: null },
  price: { type: String, required: true },
  duration: { type: String, default: '' },
  desc: { type: String, required: true },
  features: [{ type: String }],
  cta: { type: String, required: true },
  highlight: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.models.Plan || mongoose.model('Plan', planSchema);
