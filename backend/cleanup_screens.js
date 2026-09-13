const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Screen = require('./models/Screen');

async function cleanup() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Delete screens that don't end in A or B (duplicates)
    const result = await Screen.deleteMany({ 
      deviceId: { $in: ['SCR-004', 'SCR-008'] } 
    });
    console.log(`Deleted ${result.deletedCount} duplicate screens (SCR-004, SCR-008).`);

    // Ensure all screens have correct side labels
    const screens = await Screen.find({});
    for (const s of screens) {
      let updated = false;
      if (s.deviceId.endsWith('A') && s.side !== 'A') {
        s.side = 'A';
        updated = true;
      }
      if (s.deviceId.endsWith('B') && s.side !== 'B') {
        s.side = 'B';
        updated = true;
      }
      if (updated) await s.save();
    }
    console.log(`Cleaned up side labels for ${screens.length} screens.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

cleanup();
