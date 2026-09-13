const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

async function forceApprove() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const Schedule = mongoose.model('Schedule', new mongoose.Schema({
      status: String,
      date: mongoose.Schema.Types.Mixed
    }));

    // Find all schedules for today (2026-05-03) and force them to approved
    const result = await Schedule.updateMany(
      { status: { $ne: 'approved' } }, 
      { $set: { status: 'approved' } }
    );

    console.log(`Successfully forced approval for ${result.modifiedCount} schedules.`);
    
    // List all approved schedules to verify
    const all = await Schedule.find({ status: 'approved' });
    console.log('Current Approved Schedules:', JSON.stringify(all, null, 2));

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err);
  }
}

forceApprove();
