const reportService = require('../services/reportService');

class ReportController {
  async getDailyRevenue(req, res, next) {
    try {
      const data = await reportService.getDailyRevenue(req.query.date);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyRevenue(req, res, next) {
    try {
      const data = await reportService.getMonthlyRevenue(req.query.year);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getTopServices(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 5;
      const data = await reportService.getTopServices(limit);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getBarberPerformance(req, res, next) {
    try {
      const data = await reportService.getBarberPerformance();
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerVisits(req, res, next) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const data = await reportService.getCustomerVisits(limit);
      res.status(200).json({
        success: true,
        data
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ReportController();
