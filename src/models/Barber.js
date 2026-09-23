const mongoose = require('mongoose');

const barberSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    default: null
  },
  commission_percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  joining_date: {
    type: Date,
    required: true
  }
}, {
  timestamps: false,
  versionKey: false
});

// Database Performance Indexing Strategies
barberSchema.index({ user_id: 1 });

module.exports = mongoose.model('Barber', barberSchema);
