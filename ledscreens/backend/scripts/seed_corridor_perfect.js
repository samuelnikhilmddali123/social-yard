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

const seedPerfectCorridor = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    // Clear existing screens
    await Screen.deleteMany({});

    const locationName = "Vijayawada MG Road Corridor";
    
    // Manually defined points to follow the exact road curve and median
    const poleCoords = [
      { lat: 16.50595, lng: 80.6308 }, // Pole 1
      { lat: 16.50585, lng: 80.6313 }, // Pole 2
      { lat: 16.50575, lng: 80.6318 }, // Pole 3
      { lat: 16.50565, lng: 80.6323 }, // Pole 4 (Confirmed Correct)
      { lat: 16.50557, lng: 80.6328 }, // Pole 5 (Corrected)
      { lat: 16.50549, lng: 80.6333 }, // Pole 6 (Corrected)
      { lat: 16.50541, lng: 80.6338 }, // Pole 7 (Corrected)
      { lat: 16.50533, lng: 80.6343 }, // Pole 8 (Corrected)
      { lat: 16.50525, lng: 80.6348 }, // Pole 9 (Corrected)
      { lat: 16.50517, lng: 80.6353 }  // Pole 10 (Corrected)
    ];

    const screens = [];

    for (let i = 1; i <= 10; i++) {
      const poleId = `POLE-${String(i).padStart(3, '0')}`;
      const { lat, lng } = poleCoords[i-1];

      // Screen A (Front)
      const screenA = {
        name: `Pole ${i} - Front`,
        location: locationName,
        deviceId: `SCR-${String(i).padStart(3, '0')}A`,
        status: 'online',
        price: 550,
        lat: lat,
        lng: lng,
        accessType: 'public',
        side: 'A',
        poleId: poleId
      };

      // Screen B (Back)
      const screenB = {
        name: `Pole ${i} - Back`,
        location: locationName,
        deviceId: `SCR-${String(i).padStart(3, '0')}B`,
        status: 'online',
        price: 550,
        lat: lat,
        lng: lng,
        accessType: 'public',
        side: 'B',
        poleId: poleId
      };

      screens.push(screenA, screenB);
    }

    const createdScreens = await Screen.insertMany(screens);
    console.log(`Successfully deployed ${createdScreens.length} screens with PERFECT median alignment.`);

    // Link opposite screens
    for (let i = 0; i < createdScreens.length; i += 2) {
      const sA = createdScreens[i];
      const sB = createdScreens[i+1];
      
      await Screen.findByIdAndUpdate(sA._id, { oppositeScreenId: sB._id });
      await Screen.findByIdAndUpdate(sB._id, { oppositeScreenId: sA._id });
    }

    console.log('✅ Perfect median line corridor deployment complete.');
    process.exit(0);
  } catch (err) {
    console.error('Deployment failed:', err);
    process.exit(1);
  }
};

seedPerfectCorridor();
