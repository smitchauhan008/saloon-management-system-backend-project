const mongoose = require('mongoose');

const wageRecordSchema = new mongoose.Schema({
  barber_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: true
  },
  month: {
    type: String,
    required: true // Format: YYYY-MM
  },
  salary: {
    type: Number,
    default: 0.00
  },
  commission: {
    type: Number,
    default: 0.00
  },
  total_amount: {
    type: Number,
    required: true // Validation: salary + commission (handled in service layer)
  }
}, {
  timestamps: true,
  versionKey: false
});

// Database Performance Indexing Strategies
wageRecordSchema.index({ barber_id: 1 });
wageRecordSchema.index({ month: 1 });
wageRecordSchema.index({ barber_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('WageRecord', wageRecordSchema);
