const axios = require('axios');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const config = require('./config.json');

let currentVideo = null;

async function checkSchedule() {
  console.log(`[${new Date().toLocaleTimeString()}] Checking schedule for ${config.deviceId}...`);
  try {
    const response = await axios.get(`${config.serverUrl}/device/${config.deviceId}`);
    const { current, next } = response.data;

    if (current) {
      if (!currentVideo || currentVideo.url !== current.url) {
        console.log(`[PLAYING] ${current.url}`);
        currentVideo = current;
        // In a real device, this would trigger a video player
        // For simulation, we just log it.
      }
    } else {
      if (currentVideo) {
        console.log('[STOPPING] No active schedule');
        currentVideo = null;
      }
    }
  } catch (err) {
    console.error('Error polling server:', err.message);
  }
}

// Poll every 30 seconds
cron.schedule('*/30 * * * * *', checkSchedule);

console.log(`Device Player started for ID: ${config.deviceId}`);
checkSchedule();
