const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

async function listAllRaw() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    const db = conn.connection.db;
    const collection = db.collection('screens');
    const screens = await collection.find({}).toArray();
    console.log(`Total raw screens: ${screens.length}`);
    console.log(JSON.stringify(screens.map(s => ({ _id: s._id, deviceId: s.deviceId, name: s.name })), null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listAllRaw();
