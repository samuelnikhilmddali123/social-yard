const mongoose = require('mongoose');
const Screen = require('../models/Screen');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seedGov() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Create Government Screens
  const govScreens = [
    {
      name: 'SCR-001A (East Facing)',
      location: 'Benz Circle, Vijayawada',
      deviceId: 'SCR-001A',
      price: 0,
      accessType: 'government',
      side: 'A',
      lat: 16.5070,
      lng: 80.6480,
      status: 'online'
    },
    {
      name: 'SCR-001B (West Facing)',
      location: 'Benz Circle, Vijayawada',
      deviceId: 'SCR-001B',
      price: 0,
      accessType: 'government',
      side: 'B',
      lat: 16.5071,
      lng: 80.6481,
      status: 'online'
    },
    {
      name: 'SCR-002A (North Facing)',
      location: 'M.G. Road, Vijayawada',
      deviceId: 'SCR-002A',
      price: 0,
      accessType: 'government',
      side: 'A',
      lat: 16.5120,
      lng: 80.6400,
      status: 'offline'
    },
    {
       name: 'SCR-002B (South Facing)',
       location: 'M.G. Road, Vijayawada',
       deviceId: 'SCR-002B',
       price: 0,
       accessType: 'government',
       side: 'B',
       lat: 16.5121,
       lng: 80.6401,
       status: 'offline'
     }
  ];

  for (const s of govScreens) {
    await Screen.findOneAndUpdate({ deviceId: s.deviceId }, s, { upsert: true, new: true });
    console.log(`Upserted gov screen: ${s.deviceId}`);
  }

  // Link 001A and 001B
  const s1a = await Screen.findOne({ deviceId: 'SCR-001A' });
  const s1b = await Screen.findOne({ deviceId: 'SCR-001B' });
  if (s1a && s1b) {
    s1a.oppositeScreenId = s1b._id;
    s1b.oppositeScreenId = s1a._id;
    await s1a.save();
    await s1b.save();
    console.log('Linked SCR-001A and SCR-001B');
  }

  // Create Government Official User
  const govUser = {
    name: 'Gov Official One',
    email: 'official@gov.in',
    password: 'password123',
    role: 'government'
  };

  const existing = await User.findOne({ email: govUser.email });
  if (existing) {
    existing.role = 'government';
    existing.password = await bcrypt.hash(govUser.password, 10);
    await existing.save();
    console.log('Updated existing user to government');
  } else {
    const user = new User(govUser);
    await user.save();
    console.log('Created new government user');
  }

  console.log('Seeding completed');
  process.exit();
}

seedGov().catch(err => {
  console.error(err);
  process.exit(1);
});
