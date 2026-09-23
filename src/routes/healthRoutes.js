const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', (req, res) => {
  const memoryUsage = process.memoryUsage();
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime_seconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus,
      name: mongoose.connection.name || 'salon_management',
      host: mongoose.connection.host || 'localhost'
    },
    memory_usage: {
      rss_mb: `${(memoryUsage.rss / (1024 * 1024)).toFixed(2)} MB`,
      heap_total_mb: `${(memoryUsage.heapTotal / (1024 * 1024)).toFixed(2)} MB`,
      heap_used_mb: `${(memoryUsage.heapUsed / (1024 * 1024)).toFixed(2)} MB`
    },
    version: '1.0.0',
    university_accreditation: 'Darshan University (2501CS402)'
  });
});

module.exports = router;
