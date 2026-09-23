const Service = require('../models/Service');

class ServiceRepository {
  async findAll() {
    return await Service.find({});
  }

  async findById(id) {
    return await Service.findById(id);
  }

  async create(serviceData) {
    const service = new Service(serviceData);
    return await service.save();
  }

  async update(id, serviceData) {
    return await Service.findByIdAndUpdate(id, serviceData, {
      new: true,
      runValidators: true
    });
  }

  async delete(id) {
    return await Service.findByIdAndDelete(id);
  }
}

module.exports = new ServiceRepository();
