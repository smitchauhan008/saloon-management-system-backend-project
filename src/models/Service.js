const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  service_name: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  duration: {
    type: Number,
    required: true // Represented in minutes
  },
  price: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: null
  }
}, {
  timestamps: false,
  versionKey: false
});

// Database Performance Indexing Strategies
serviceSchema.index({ service_name: 1 });
serviceSchema.index({ price: 1 });

module.exports = mongoose.model('Service', serviceSchema);
