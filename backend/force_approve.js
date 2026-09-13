const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function forceApprove() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const ScheduleSchema = new mongoose.Schema({
      status: String,
      date: mongoose.Schema.Types.Mixed,
      startTime: String,
      endTime: String,
      userId: mongoose.Schema.Types.ObjectId,
      videoId: mongoose.Schema.Types.ObjectId,
      screenId: mongoose.Schema.Types.ObjectId
    });
    const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);

    const VideoSchema = new mongoose.Schema({ filePath: String, title: String });
    const Video = mongoose.models.Video || mongoose.model('Video', VideoSchema);

    const ScreenSchema = new mongoose.Schema({ deviceId: String, name: String });
    const Screen = mongoose.models.Screen || mongoose.model('Screen', ScreenSchema);

    const UserSchema = new mongoose.Schema({ email: String });
    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const { getPresignedUrl } = require('./utils/s3');
    const latestVideo = await Video.findOne().sort({ _id: -1 });
    
    if (latestVideo) {
      console.log('--- Video Diagnostic ---');
      console.log('Title:', latestVideo.title);
      console.log('Stored Path:', latestVideo.filePath);
      const testUrl = await getPresignedUrl(latestVideo.filePath);
      console.log('Generated Link:', testUrl);
      console.log('------------------------');
    }

    // Force Approve and Extend
    await Schedule.updateMany({}, { $set: { status: 'approved', endTime: '23:59' } });

    const allScreens = await Screen.find();
    const adminUser = await User.findOne({ email: 'admin@jaan.com' });

    if (latestVideo && adminUser) {
      console.log(`Processing ${allScreens.length} screens...`);
      for (const screen of allScreens) {
        // Find or create schedule for today
        let schedule = await Schedule.findOne({ screenId: screen._id, date: '2026-05-03' });
        if (!schedule) {
          console.log(`Creating schedule for ${screen.deviceId}`);
          schedule = new Schedule({
            screenId: screen._id,
            date: '2026-05-03',
            startTime: '00:00',
            userId: adminUser._id
          });
        }
        
        // Update to the latest video
        schedule.videoId = latestVideo._id;
        schedule.status = 'approved';
        schedule.endTime = '23:59';
        await schedule.save();
      }
      console.log('✅ ALL screens forced to latest video!');
    }

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

forceApprove();
