const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_management';
    await mongoose.connect(connStr);
    console.log('Database connected for seeding.');

    const adminEmail = 'admin@salon.com';
    const existingAdmin = await User.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Administrator account already exists.');
      process.exit(0);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('adminpassword123', salt);

    const adminUser = new User({
      name: 'System Administrator',
      email: adminEmail,
      password: hashedPassword,
      role: 'Administrator',
      status: 'Active'
    });

    await adminUser.save();
    console.log('Administrator account seeded successfully!');
    console.log('Email: admin@salon.com');
    console.log('Password: adminpassword123');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding Administrator:', error);
    process.exit(1);
  }
};

seedAdmin();
