const Barber = require('../models/Barber');

class BarberRepository {
  async findAll() {
    return await Barber.find({}).populate('user_id', 'name email role status');
  }

  async findById(id) {
    return await Barber.findById(id).populate('user_id', 'name email role status');
  }

  async findByUserId(userId) {
    return await Barber.findOne({ user_id: userId }).populate('user_id', 'name email role status');
  }

  async create(barberData) {
    const barber = new Barber(barberData);
    return await barber.save();
  }

  async update(id, barberData) {
    return await Barber.findByIdAndUpdate(id, barberData, {
      new: true,
      runValidators: true
    }).populate('user_id', 'name email role status');
  }

  async delete(id) {
    return await Barber.findByIdAndDelete(id);
  }
}

module.exports = new BarberRepository();
