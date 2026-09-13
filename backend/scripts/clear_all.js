const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const clearAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const screenResult = await mongoose.connection.collection('screens').deleteMany({});
    const scheduleResult = await mongoose.connection.collection('schedules').deleteMany({});
    
    console.log(`Deleted ${screenResult.deletedCount} screens.`);
    console.log(`Deleted ${scheduleResult.deletedCount} schedules.`);

    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
};

clearAll();
