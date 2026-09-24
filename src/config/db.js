const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers for Windows SRV record resolution
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (e) {
  // Ignore if not supported in environment
}

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://localhost:27017/salon_management';
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`---mongodb connection successfully---: ${mongoose.connection.host}`);
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
