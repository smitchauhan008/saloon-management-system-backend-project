const barberRepository = require('../repositories/barberRepository');
const userRepository = require('../repositories/userRepository');

class BarberService {
  async getAllBarbers() {
    return await barberRepository.findAll();
  }

  async getBarberById(id) {
    const barber = await barberRepository.findById(id);
    if (!barber) {
      throw new Error('Barber profile not found');
    }
    return barber;
  }

  async createBarber(barberData) {
    // 1. Verify referencing user exists
    const user = await userRepository.findById(barberData.user_id);
    if (!user) {
      throw new Error('Associated staff user not found');
    }

    // 2. Enforce linking only to staff accounts with 'Barber' role
    if (user.role !== 'Barber') {
      throw new Error('Referenced user role must be Barber');
    }

    // 3. Prevent duplicate barber profiles
    const existing = await barberRepository.findByUserId(barberData.user_id);
    if (existing) {
      throw new Error('Barber profile already exists for this user');
    }

    return await barberRepository.create({
      ...barberData,
      joining_date: new Date(barberData.joining_date)
    });
  }

  async updateBarber(id, barberData) {
    const data = { ...barberData };
    if (data.joining_date) {
      data.joining_date = new Date(data.joining_date);
    }
    const barber = await barberRepository.update(id, data);
    if (!barber) {
      throw new Error('Barber profile not found or failed to update');
    }
    return barber;
  }

  async deleteBarber(id) {
    const barber = await barberRepository.delete(id);
    if (!barber) {
      throw new Error('Barber profile not found or failed to delete');
    }
    return barber;
  }
}

module.exports = new BarberService();
