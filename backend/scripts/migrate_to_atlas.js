const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// --- CONFIGURATION ---
const LOCAL_URI = 'mongodb://localhost:27017/led-screens'; // Change this if your local DB name is different
const ATLAS_URI = process.env.MONGODB_URI;

if (!ATLAS_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  process.exit(1);
}

// Models
const User = require('../models/User');
const Screen = require('../models/Screen');
const Video = require('../models/Video');
const Schedule = require('../models/Schedule');
const Billboard = require('../models/Billboard');
const Plan = require('../models/Plan');

async function migrate() {
  try {
    console.log('🚀 Starting Data Migration...');

    // 1. Connect to Local
    const localConn = await mongoose.createConnection(LOCAL_URI).asPromise();
    console.log('📡 Connected to Local MongoDB');

    // 2. Connect to Atlas
    const atlasConn = await mongoose.createConnection(ATLAS_URI).asPromise();
    console.log('🌐 Connected to MongoDB Atlas');

    const collections = [
      { name: 'Users', modelName: 'User', schema: User.schema },
      { name: 'Screens', modelName: 'Screen', schema: Screen.schema },
      { name: 'Videos', modelName: 'Video', schema: Video.schema },
      { name: 'Schedules', modelName: 'Schedule', schema: Schedule.schema },
      { name: 'Billboards', modelName: 'Billboard', schema: Billboard.schema },
      { name: 'Plans', modelName: 'Plan', schema: Plan.schema },
    ];

    for (const col of collections) {
      console.log(`\n📦 Migrating ${col.name}...`);
      
      const LocalModel = localConn.model(col.modelName, col.schema);
      const AtlasModel = atlasConn.model(col.modelName, col.schema);

      const localData = await LocalModel.find({});
      console.log(`   Found ${localData.length} records locally.`);

      if (localData.length > 0) {
        // Clear Atlas collection first to avoid duplicates (optional, but safer for a clean migration)
        await AtlasModel.deleteMany({});
        
        // Insert data
        await AtlasModel.insertMany(localData);
        console.log(`   ✅ Successfully migrated ${col.name} to Atlas.`);
      } else {
        console.log(`   ⏭️ Skipping ${col.name} (no local data).`);
      }
    }

    console.log('\n✨ Migration Complete! All data is now live on Atlas.');
    
    await localConn.close();
    await atlasConn.close();
    process.exit(0);

  } catch (err) {
    console.error('\n❌ Migration Failed:', err.message);
    process.exit(1);
  }
}

migrate();
