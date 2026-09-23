const serviceRepository = require('../repositories/serviceRepository');

class ServiceService {
  async getAllServices() {
    return await serviceRepository.findAll();
  }

  async getServiceById(id) {
    const service = await serviceRepository.findById(id);
    if (!service) {
      throw new Error('Service not found');
    }
    return service;
  }

  async createService(serviceData) {
    if (serviceData.name && !serviceData.service_name) {
      serviceData.service_name = serviceData.name;
    } else if (serviceData.service_name && !serviceData.name) {
      serviceData.name = serviceData.service_name;
    }
    return await serviceRepository.create(serviceData);
  }

  async updateService(id, serviceData) {
    if (serviceData.name && !serviceData.service_name) {
      serviceData.service_name = serviceData.name;
    } else if (serviceData.service_name && !serviceData.name) {
      serviceData.name = serviceData.service_name;
    }
    const service = await serviceRepository.update(id, serviceData);
    if (!service) {
      throw new Error('Service not found or failed to update');
    }
    return service;
  }

  async deleteService(id) {
    const service = await serviceRepository.delete(id);
    if (!service) {
      throw new Error('Service not found or failed to delete');
    }
    return service;
  }
}

module.exports = new ServiceService();
