const mongoose = require('mongoose');
const Screen = require('./models/Screen');
require('dotenv').config();

async function updateCameraUrls() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/led-screens');
    console.log('✅ Connected to MongoDB');

    const ezykamUrl = 'https://web.ezykam.com/playback';
    
    const result = await Screen.updateMany({}, { 
      cameraStreamUrl: ezykamUrl,
      streamType: 'mjpeg' // Using mjpeg as a placeholder for web links
    });

    console.log(`✅ Updated ${result.modifiedCount} screens with camera URL: ${ezykamUrl}`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

updateCameraUrls();
