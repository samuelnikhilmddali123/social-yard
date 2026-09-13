const mongoose = require('mongoose');
const Screen = require('./models/Screen');
require('dotenv').config();

async function updateCameraUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/led-screens');
    console.log('✅ Connected to MongoDB');

    // 1. Remove camera URL from all screens
    await Screen.updateMany({}, { cameraStreamUrl: '', streamType: '' });
    console.log('🧹 Cleared all screen camera URLs');

    // 2. Set Ezykam URL ONLY for Screen 01 (SCR-01)
    const ezykamUrl = 'https://web.ezykam.com/playback';
    const result = await Screen.updateOne({ deviceId: 'SCR-01' }, { 
      cameraStreamUrl: ezykamUrl,
      streamType: 'mjpeg' 
    });

    if (result.matchedCount > 0) {
      console.log(`✅ Updated Benz Circle Mall LED (SCR-001) with camera URL: ${ezykamUrl}`);
    } else {
      console.log('❌ Benz Circle Mall LED (SCR-001) not found!');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateCameraUrls();
