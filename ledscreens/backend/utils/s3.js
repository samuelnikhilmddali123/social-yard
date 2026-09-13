const storage = require('./storage');

module.exports = {
  getPresignedUrl: async (filePath) => storage.getFileUrl(filePath),
  getPresignedUploadUrl: async () => null,
  getFileUrl: storage.getFileUrl
};
