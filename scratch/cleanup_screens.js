const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Screen = require('../backend/models/Screen');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const duplicateIds = [
      '6a0851b6037a448071f8ce67', // pole4 / SCR-004
      '6a0852ed105b2a67bd5a589b'  // pole8 / SCR-008
    ];

    const result = await Screen.deleteMany({ _id: { $in: duplicateIds } });
    console.log(`Deleted ${result.deletedCount} duplicate screens.`);

    // Also update any remaining screens to have correct 'side' if they are 'none'
    const screens = await Screen.find({});
    for (const s of screens) {
      if (s.side === 'none' || !s.side) {
        if (s.deviceId.endsWith('A')) s.side = 'A';
        if (s.deviceId.endsWith('B')) s.side = 'B';
        await s.save();
      }
    }
    console.log('Updated side labels for consistency.');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanup();
