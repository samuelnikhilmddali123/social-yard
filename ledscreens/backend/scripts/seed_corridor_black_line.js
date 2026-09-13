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

const seedFinalBlackLineCorridor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing screens
    await Screen.deleteMany({});

    const locationName = "Vijayawada MG Road Corridor";
    
    // Positioned EXACTLY on the black divider line shown in the map
    const startLat = 16.50595;
    const startLng = 80.6308;
    
    // Slanted path to follow the road median precisely
    const latStep = -0.000105; 
    const lngStep = 0.0005;

    const screens = [];

    for (let i = 1; i <= 10; i++) {
      const poleId = `POLE-${String(i).padStart(3, '0')}`;
      const poleLat = startLat + ((i-1) * latStep);
      const poleLng = startLng + ((i-1) * lngStep);

      // Screen A (Front - Faces Benz Circle traffic)
      const screenA = {
        name: `Pole ${i} - Front`,
        location: locationName,
        deviceId: `SCR-${String(i).padStart(3, '0')}A`,
        status: 'online',
        price: 550,
        lat: poleLat,
        lng: poleLng,
        accessType: 'public',
        side: 'A',
        poleId: poleId
      };

      // Screen B (Back - Faces City/Statue traffic)
      const screenB = {
        name: `Pole ${i} - Back`,
        location: locationName,
        deviceId: `SCR-${String(i).padStart(3, '0')}B`,
        status: 'online',
        price: 550,
        lat: poleLat,
        lng: poleLng,
        accessType: 'public',
        side: 'B',
        poleId: poleId
      };

      screens.push(screenA, screenB);
    }

    const createdScreens = await Screen.insertMany(screens);
    console.log(`Successfully deployed ${createdScreens.length} screens EXACTLY on the Divider.`);

    // Link opposite screens
    for (let i = 0; i < createdScreens.length; i += 2) {
      const sA = createdScreens[i];
      const sB = createdScreens[i+1];
      
      await Screen.findByIdAndUpdate(sA._id, { oppositeScreenId: sB._id });
      await Screen.findByIdAndUpdate(sB._id, { oppositeScreenId: sA._id });
    }

    console.log('✅ Final median line corridor deployment complete.');
    process.exit(0);
  } catch (err) {
    console.error('Deployment failed:', err);
    process.exit(1);
  }
};

seedFinalBlackLineCorridor();
