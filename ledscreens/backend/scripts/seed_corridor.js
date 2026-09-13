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

const seedCorridor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing screens if any (User already asked to delete all previously)
    await Screen.deleteMany({});

    const locationName = "Vijayawada PWD Ground";
    const baseLat = 16.5070;
    const baseLng = 80.6480;
    const screens = [];

    for (let i = 1; i <= 10; i++) {
      const poleId = `POLE-${String(i).padStart(3, '0')}`;
      const poleLat = baseLat + (i * 0.0002);
      const poleLng = baseLng + (i * 0.0001);

      // Side A (FRONT)
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

      // Side B (BACK)
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
    console.log(`Created ${createdScreens.length} screens across 10 poles.`);

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

seedCorridor();
