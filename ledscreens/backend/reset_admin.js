const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function checkAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/led-screens');
    console.log('✅ Connected to MongoDB');

    const email = 'admin@jaan.com';
    let user = await User.findOne({ email });

    if (!user) {
      console.log('❌ Admin not found. Creating...');
      user = new User({
        name: 'System Admin',
        email: email,
        password: 'adminjaan123',
        role: 'admin'
      });
      await user.save();
      console.log('✅ Admin created with password: adminjaan123');
    } else {
      console.log('👤 Admin found:', user.email);
      // Reset password to be sure
      user.password = 'adminjaan123';
      await user.save();
      console.log('🔄 Password reset to: adminjaan123');
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

checkAdmin();
