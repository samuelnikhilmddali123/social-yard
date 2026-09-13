const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const ScreenSchema = new mongoose.Schema({}, { strict: false });
const Screen = mongoose.model('Screen', ScreenSchema);

const clearInventory = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    const result = await Screen.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} screens.`);

    process.exit(0);
  } catch (err) {
    console.error('Error clearing inventory:', err);
    process.exit(1);
  }
};

clearInventory();
