const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    default: null
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: null
  },
  created_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: false },
  versionKey: false
});

// Database Performance Indexing Strategies
customerSchema.index({ phone: 1 });
customerSchema.index({ email: 1 });
customerSchema.index({ created_at: -1 });

module.exports = mongoose.model('Customer', customerSchema);
