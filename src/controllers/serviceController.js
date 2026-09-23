const serviceService = require('../services/serviceService');

class ServiceController {
  async getAllServices(req, res, next) {
    try {
      const services = await serviceService.getAllServices();
      res.status(200).json({
        success: true,
        data: services
      });
    } catch (error) {
      next(error);
    }
  }

  async getServiceById(req, res, next) {
    try {
      const service = await serviceService.getServiceById(req.params.id);
      res.status(200).json({
        success: true,
        data: service
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async createService(req, res, next) {
    try {
      const service = await serviceService.createService(req.body);
      res.status(201).json({
        success: true,
        data: service
      });
    } catch (error) {
      next(error);
    }
  }

  async updateService(req, res, next) {
    try {
      const service = await serviceService.updateService(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: service
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteService(req, res, next) {
    try {
      await serviceService.deleteService(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Service package removed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new ServiceController();
