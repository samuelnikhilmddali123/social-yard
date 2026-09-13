const mongoose = require('mongoose');
const Screen = require('./models/Screen');
const Schedule = require('./models/Schedule');
require('dotenv').config();

async function debug() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/led-screens';
    await mongoose.connect(uri);
    
    const screen = await Screen.findOne({ $or: [{ name: /Screen 1/i }, { deviceId: 'SCR-001' }] });
    if (!screen) {
      console.log('Screen not found');
      process.exit(0);
    }

    console.log(`--- Screen Debug: ${screen.name} (${screen.deviceId}) ---`);
    
    const now = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
    const istDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateStr = istDate.toISOString().split('T')[0];
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    console.log(`Current IST Date: ${dateStr}, Time: ${currentTime}`);

    const schedules = await Schedule.find({ screenId: screen._id }).populate('videoId');
    console.log(`Found ${schedules.length} total schedules for this screen.`);

    schedules.forEach(s => {
      console.log(`- ID: ${s._id}, Date: ${s.date}, Time: ${s.startTime}-${s.endTime}, Status: ${s.status}, Video: ${s.videoId?.title}`);
    });

    const active = schedules.filter(s => 
      (s.date === dateStr || (s.date instanceof Date && s.date.toISOString().startsWith(dateStr))) &&
      s.startTime <= currentTime && 
      s.endTime >= currentTime &&
      ['approved', 'active'].includes(s.status)
    );

    if (active.length > 0) {
      console.log('✅ Found active schedule!');
    } else {
      console.log('❌ No active schedule found for current time.');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
debug();
