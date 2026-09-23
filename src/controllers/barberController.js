const barberService = require('../services/barberService');

class BarberController {
  async getAllBarbers(req, res, next) {
    try {
      const barbers = await barberService.getAllBarbers();
      res.status(200).json({
        success: true,
        data: barbers
      });
    } catch (error) {
      next(error);
    }
  }

  async getBarberById(req, res, next) {
    try {
      const barber = await barberService.getBarberById(req.params.id);
      res.status(200).json({
        success: true,
        data: barber
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async createBarber(req, res, next) {
    try {
      const barber = await barberService.createBarber(req.body);
      res.status(201).json({
        success: true,
        data: barber
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateBarber(req, res, next) {
    try {
      const barber = await barberService.updateBarber(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: barber
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteBarber(req, res, next) {
    try {
      await barberService.deleteBarber(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Barber profile removed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new BarberController();
