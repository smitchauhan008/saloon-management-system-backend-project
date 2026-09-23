const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_management';
    await mongoose.connect(connStr);
    console.log(`---mongodb connection successfully---: ${mongoose.connection.host}`);

  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
