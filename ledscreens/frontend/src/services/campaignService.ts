import axios from 'axios';
import API from './api';

export const uploadVideo = async (file: File, title: string) => {
  try {
    // 1. Request a presigned URL from the backend
    const presignedRes = await API.post('/videos/presigned-url', {
      filename: file.name,
      fileType: file.type
    });

    // 2. If S3 is configured, perform direct upload to S3
    if (presignedRes.data.useS3) {
      const { uploadUrl, filePath } = presignedRes.data;
      
      // Upload file directly to S3 (use clean axios to avoid appending Authorization headers)
      await axios.put(uploadUrl, file, {
        headers: {
          'Content-Type': file.type
        }
      });

      // Confirm upload and save metadata in the database
      const metadataRes = await API.post('/videos/save-metadata', {
        title,
        filePath
      });
      
      return metadataRes.data;
    }
  } catch (err) {
    console.warn('S3 direct upload failed or not configured, falling back to local upload...', err);
  }

  // 3. Fallback: upload file to local backend storage
  const formData = new FormData();
  formData.append('video', file);
  formData.append('title', title);
  
  const response = await API.post('/videos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const createSchedule = async (scheduleData: {
  videoId: string;
  screenId: string;
  date: string;
  startTime: string;
  endTime: string;
  isInstant?: boolean;
  duration?: number;
}) => {
  const response = await API.post('/schedule', scheduleData);
  return response.data;
};

export const calculateBookingTotal = async (screenIds: string[]) => {
  const response = await API.post('/schedule/calculate-total', { screenIds });
  return response.data;
};

export const createCampaignBooking = async (data: {
  videoId: string;
  screenIds: string[];
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  isInstant?: boolean;
  duration?: number;
  durationSeconds?: number;
  repeatCount?: number;
  repeatTimes?: string[];
  slotCount?: number;
  hasWatermark?: boolean;
  format?: string;
  couponCode?: string;
  gst?: string;
  companyName?: string;
}) => {
  const response = await API.post('/schedule/campaign', data);
  return response.data;
};

export const getCorridorPricing = async () => {
  const response = await API.get('/corridors/pricing');
  return response.data;
};

export const getScreens = async () => {
  const response = await API.get('/screens');
  return response.data;
};

export const checkAvailability = async (data: {
  screenId: string;
  date: string;
  endDate?: string;
  startTime: string;
  endTime: string;
}) => {
  const response = await API.post('/schedule/check-availability', data);
  return response.data;
};

/** All users' blocking bookings for map availability (not filtered by userId). */
export const getGlobalAvailability = async (params?: {
  date?: string;
  startTime?: string;
  endTime?: string;
}) => {
  const response = await API.get('/schedule/global-availability', { params });
  return response.data;
};
