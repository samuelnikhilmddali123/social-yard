const Screen = require('./models/Screen');
const mongoose = require('mongoose');
require('dotenv').config();

async function check() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/led-screens';
  await mongoose.connect(uri);
  const screens = await Screen.find({}).lean();
  const badScreens = screens.filter(s => !s.poleId || !s.location || !s.name);
  console.log('Total screens:', screens.length);
  console.log('Bad screens:', badScreens.length);
  if (badScreens.length > 0) {
    console.log('Sample bad screen:', badScreens[0]);
  }
  await mongoose.disconnect();
}

check();
