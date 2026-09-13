const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const ScreenSchema = new mongoose.Schema({
  name: String,
  location: String,
  deviceId: String,
  status: String,
  price: Number,
  lat: Number,
  lng: Number,
  accessType: String,
  side: String,
  poleId: String,
  oppositeScreenId: mongoose.Schema.Types.ObjectId
});

const Screen = mongoose.model('Screen', ScreenSchema);

const seedCorrectedCorridor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing screens
    await Screen.deleteMany({});

    const locationName = "Vijayawada PWD Grounds (MG Road)";
    
    // Corrected to be EXACTLY on MG Road line
    const startLat = 16.5055;
    const startLng = 80.6312;
    
    // Aligned precisely along the MG Road stretch
    const latStep = -0.00008; 
    const lngStep = 0.00045;

    const screens = [];

    for (let i = 1; i <= 10; i++) {
      const poleId = `POLE-${String(i).padStart(3, '0')}`;
      const poleLat = startLat + ((i-1) * latStep);
      const poleLng = startLng + ((i-1) * lngStep);

      // Side A (FRONT - Faces traffic coming from Benz Circle)
      const screenA = {
        name: `Pole ${i} - Front`,
        location: locationName,
        deviceId: `SCR-${String(i).padStart(3, '0')}A`,
        status: 'online',
        price: 500,
        lat: poleLat,
        lng: poleLng,
        accessType: 'public',
        side: 'A',
        poleId: poleId
      };

      // Side B (BACK - Faces traffic coming from PCR/Statue)
      const screenB = {
        name: `Pole ${i} - Back`,
        location: locationName,
        deviceId: `SCR-${String(i).padStart(3, '0')}B`,
        status: 'online',
        price: 500,
        lat: poleLat,
        lng: poleLng,
        accessType: 'public',
        side: 'B',
        poleId: poleId
      };

      screens.push(screenA, screenB);
    }

    const createdScreens = await Screen.insertMany(screens);
    console.log(`Created ${createdScreens.length} screens EXACTLY on MG Road.`);

    // Link opposite screens
    for (let i = 0; i < createdScreens.length; i += 2) {
      const sA = createdScreens[i];
      const sB = createdScreens[i+1];
      
      await Screen.findByIdAndUpdate(sA._id, { oppositeScreenId: sB._id });
      await Screen.findByIdAndUpdate(sB._id, { oppositeScreenId: sA._id });
    }

    console.log('Linked all opposite screens (A <-> B).');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seedCorrectedCorridor();
