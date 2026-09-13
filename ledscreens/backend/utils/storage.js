const path = require('path');

/**
 * Resolves a file path or database reference to a publicly accessible URL
 * for LED screens, devices, and web frontend clients.
 *
 * Configurable Environment Variables:
 * - CLOUDFLARE_CDN_URL or CLOUDFLARE_PUBLIC_URL (e.g. https://cdn.yourdomain.com)
 * - SERVER_URL (e.g. https://api.yourdomain.com)
 */
const getFileUrl = (filePath) => {
  if (!filePath) return filePath;

  // Handle legacy AWS S3 URLs if any remain in DB
  if (filePath.includes('s3.') && filePath.includes('.amazonaws.com')) {
    try {
      const url = new URL(filePath);
      // Extract pathname key (e.g. /creative/xxx.mp4)
      filePath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    } catch (e) {
      // ignore invalid URL parsing
    }
  }

  // If already a full http/https URL (and not AWS S3), return as is
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Determine base domain (Cloudflare CDN / Tunnel / Server URL)
  const cdnBase = process.env.CLOUDFLARE_CDN_URL || process.env.CLOUDFLARE_PUBLIC_URL || process.env.MEDIA_BASE_URL || process.env.SERVER_URL || '';

  // Clean relative path formatting
  let cleanPath = filePath.replace(/\\/g, '/');
  if (!cleanPath.startsWith('/')) {
    cleanPath = '/' + cleanPath;
  }

  // Ensure path starts with /uploads/ if it's relative
  if (!cleanPath.startsWith('/uploads/') && (cleanPath.startsWith('/creative/') || cleanPath.startsWith('/partners/'))) {
    cleanPath = '/uploads' + cleanPath;
  }

  if (cdnBase) {
    const trimmedBase = cdnBase.endsWith('/') ? cdnBase.slice(0, -1) : cdnBase;
    return `${trimmedBase}${cleanPath}`;
  }

  return cleanPath;
};

/**
 * Backward compatible wrapper for getPresignedUrl
 */
const getPresignedUrl = async (filePath) => {
  return getFileUrl(filePath);
};

/**
 * Presigned Upload URL mock / fallback for CPU Server Build.
 * Since files are uploaded directly to the CPU server /api/videos/upload,
 * this signals the client that direct server upload should be used.
 */
const getPresignedUploadUrl = async (filename, fileType) => {
  return null;
};

module.exports = {
  getFileUrl,
  getPresignedUrl,
  getPresignedUploadUrl,
};
