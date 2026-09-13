const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const Screen = require('./models/Screen');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing screens
    await Screen.deleteMany({});
    console.log('Cleared existing screens.');
    
    const startLat = 16.5055;
    const startLng = 80.6312;
    const latStep = -0.00008; 
    const lngStep = 0.00045;
    
    const defaultScreens = [];
    for (let i = 1; i <= 10; i++) {
      const poleId = `POLE-${String(i).padStart(3, '0')}`;
      const poleLat = startLat + ((i-1) * latStep);
      const poleLng = startLng + ((i-1) * lngStep);

      defaultScreens.push({
        name: `Pole ${i} - Front`,
        location: "Vijayawada MG Road Corridor",
        deviceId: `SCR-${String(i).padStart(3, '0')}A`,
        status: 'online', price: 500,
        lat: poleLat, lng: poleLng,
        accessType: 'public', side: 'A', poleId: poleId
      });
      defaultScreens.push({
        name: `Pole ${i} - Back`,
        location: "Vijayawada MG Road Corridor",
        deviceId: `SCR-${String(i).padStart(3, '0')}B`,
        status: 'online', price: 500,
        lat: poleLat, lng: poleLng,
        accessType: 'public', side: 'B', poleId: poleId
      });
    }
    
    const created = await Screen.insertMany(defaultScreens);
    
    // Link opposite screens
    for (let i = 0; i < created.length; i += 2) {
      const sA = created[i];
      const sB = created[i+1];
      await Screen.findByIdAndUpdate(sA._id, { oppositeScreenId: sB._id });
      await Screen.findByIdAndUpdate(sB._id, { oppositeScreenId: sA._id });
    }

    console.log(`Inventory reset successful. Created ${created.length} screens.`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
