const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const PromoCode = require('../models/PromoCode');

async function createSocialAdsAccount() {
  let mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ledscreens';
  
  try {
    console.log(`🔌 Connecting to MongoDB at ${mongoUri}...`);
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
      console.log('✅ Connected to MongoDB.');
    } catch (connErr) {
      console.warn('⚠️ Local MongoDB connection failed. Starting MongoMemoryServer fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({ binary: { version: '4.4.26' } });
      mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
      console.log('✨ Connected to MongoMemoryServer at:', mongoUri);
    }

    const email = 'socialads@e3di.org';
    const rawPassword = 'SocialAdsPass#2026';
    const name = 'Social Ads Manager';
    const companyName = 'Social Ads Partner Network';

    let user = await User.findOne({ email });
    if (user) {
      user.name = name;
      user.password = rawPassword; // User model pre-save hook handles hashing
      user.profileCompleted = true;
      user.companyName = companyName;
      await user.save();
      console.log(`✨ Updated existing Social Ads user account: ${email}`);
    } else {
      user = new User({
        name,
        email,
        password: rawPassword,
        role: 'user',
        authProvider: 'local',
        profileCompleted: true,
        companyName,
        phone: '9999999999'
      });
      await user.save();
      console.log(`🎉 Created new Social Ads user account: ${email}`);
    }

    // Generate a default Social Promo Code for this account
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codeStr = 'SOCIAL';
    const bytes = crypto.randomBytes(4);
    for (let i = 0; i < 4; i++) {
      codeStr += chars[bytes[i] % chars.length];
    }

    let existingCode = await PromoCode.findOne({ code: codeStr });
    while (existingCode) {
      codeStr = 'SOCIAL';
      const freshBytes = crypto.randomBytes(4);
      for (let i = 0; i < 4; i++) {
        codeStr += chars[freshBytes[i] % chars.length];
      }
      existingCode = await PromoCode.findOne({ code: codeStr });
    }

    const newPromo = await PromoCode.create({
      code: codeStr,
      status: 'ACTIVE',
      type: 'SOCIAL_ADS',
      createdByName: user.name,
      createdByEmail: user.email,
      createdById: user._id,
      createdAt: new Date()
    });

    console.log(`🎟️ Generated initial Social Ads Promo Code: ${newPromo.code}`);

    console.log('\n--- SOCIAL ADS ACCOUNT SUMMARY ---');
    console.log(`Email: ${user.email}`);
    console.log(`Password: ${rawPassword}`);
    console.log(`Name: ${user.name}`);
    console.log(`Role: ${user.role}`);
    console.log(`Initial Promo Code: ${newPromo.code}`);
    console.log('----------------------------------\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating Social Ads Account:', err);
    process.exit(1);
  }
}

createSocialAdsAccount();
