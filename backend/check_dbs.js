const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

async function checkDbs() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    const admin = new mongoose.mongo.Admin(conn.connection.db);
    const dbs = await admin.listDatabases();
    console.log('Databases:', JSON.stringify(dbs, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkDbs();
