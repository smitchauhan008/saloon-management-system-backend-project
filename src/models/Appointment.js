const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  barber_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Barber',
    required: true
  },
  service_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  appointment_date: {
    type: Date,
    required: true
  },
  appointment_time: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  remarks: {
    type: String,
    default: null
  }
}, {
  timestamps: true,
  versionKey: false
});

// Database Performance Indexing Strategies
appointmentSchema.index({ customer_id: 1 });
appointmentSchema.index({ barber_id: 1 });
appointmentSchema.index({ service_id: 1 });
appointmentSchema.index({ status: 1 });
appointmentSchema.index({ barber_id: 1, appointment_date: 1 });
appointmentSchema.index({ appointment_date: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
