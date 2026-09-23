const mongoose = require('mongoose');

const calendarExceptionSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  type: {
    type: String,
    enum: ['Holiday', 'CustomBlock', 'Maintenance'],
    default: 'Holiday'
  },
  start_time: {
    type: String,
    default: null // Null indicates full-day block / holiday
  },
  end_time: {
    type: String,
    default: null
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  barber_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    default: null // Null indicates salon-wide exception applicable to all staff
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

module.exports = mongoose.model('CalendarException', calendarExceptionSchema);
