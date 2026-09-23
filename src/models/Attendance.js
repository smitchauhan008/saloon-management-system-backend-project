const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  barber_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: true
  },
  check_in: {
    type: Date,
    required: true
  },
  check_out: {
    type: Date,
    default: null
  },
  date: {
    type: Date,
    required: true
  }
}, {
  timestamps: false,
  versionKey: false
});

// Database Performance Indexing Strategies
attendanceSchema.index({ barber_id: 1 });
attendanceSchema.index({ date: 1 });
attendanceSchema.index({ barber_id: 1, date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
