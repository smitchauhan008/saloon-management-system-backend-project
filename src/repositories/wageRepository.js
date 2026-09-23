const WageRecord = require('../models/WageRecord');
const Barber = require('../models/Barber');
const Appointment = require('../models/Appointment');

class WageRepository {
  async findAll(filter = {}) {
    return await WageRecord.find(filter)
      .populate({
        path: 'barber_id',
        populate: { path: 'user_id', select: 'name email role' }
      })
      .sort({ month: -1, createdAt: -1 });
  }

  async findById(id) {
    return await WageRecord.findById(id)
      .populate({
        path: 'barber_id',
        populate: { path: 'user_id', select: 'name email role' }
      });
  }

  async findByBarberAndMonth(barberId, month) {
    return await WageRecord.findOne({ barber_id: barberId, month })
      .populate({
        path: 'barber_id',
        populate: { path: 'user_id', select: 'name email role' }
      });
  }

  async upsert(barberId, month, data) {
    return await WageRecord.findOneAndUpdate(
      { barber_id: barberId, month },
      { $set: data },
      { new: true, upsert: true, runValidators: true }
    ).populate({
      path: 'barber_id',
      populate: { path: 'user_id', select: 'name email role' }
    });
  }

  async create(data) {
    const record = new WageRecord(data);
    await record.save();
    return await this.findById(record._id);
  }

  async delete(id) {
    return await WageRecord.findByIdAndDelete(id);
  }

  async findBarberById(barberId) {
    return await Barber.findById(barberId).populate('user_id', 'name email role status');
  }

  async findBarberByUserId(userId) {
    return await Barber.findOne({ user_id: userId }).populate('user_id', 'name email role status');
  }

  async findAllBarbers() {
    return await Barber.find().populate('user_id', 'name email role status');
  }

  async findCompletedAppointments(barberId, startDate, endDate) {
    const query = {
      barber_id: barberId,
      status: 'Completed',
      appointment_date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    return await Appointment.find(query)
      .populate('service_id', 'service_name name price duration')
      .populate('customer_id', 'name phone email')
      .sort({ appointment_date: 1 });
  }
}

module.exports = new WageRepository();
