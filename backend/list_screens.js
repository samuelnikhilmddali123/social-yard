const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Screen = require('./models/Screen');

async function listScreens() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const screens = await Screen.find({});
    console.log(`Total screens: ${screens.length}`);
    console.log(JSON.stringify(screens.map(s => ({ _id: s._id, deviceId: s.deviceId, name: s.name })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listScreens();
