const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  duration: { type: Number, default: 0 }, // in seconds
  createdAt: { type: Date, default: Date.now }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

VideoSchema.virtual('url').get(function() {
  // If it's a full URL (like S3), return as is
  if (this.filePath.startsWith('http')) return this.filePath;
  // Otherwise, treat as local path and ensure leading slash
  return '/' + this.filePath.replace(/\\/g, '/').replace(/^\//, '');
});

module.exports = mongoose.models.Video || mongoose.model('Video', VideoSchema);
