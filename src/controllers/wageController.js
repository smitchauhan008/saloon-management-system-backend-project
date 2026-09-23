const wageService = require('../services/wageService');

class WageController {
  async calculatePayroll(req, res, next) {
    try {
      const result = await wageService.calculatePayroll(req.query, req.user);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  async finalizePayroll(req, res, next) {
    try {
      const result = await wageService.finalizePayroll(req.body, req.user);
      res.status(201).json({
        success: true,
        message: result.message,
        data: result.wage_record
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllWages(req, res, next) {
    try {
      const records = await wageService.getAllWages(req.query, req.user);
      res.status(200).json({
        success: true,
        data: records
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyWages(req, res, next) {
    try {
      const records = await wageService.getMyWages(req.user);
      res.status(200).json({
        success: true,
        data: records
      });
    } catch (error) {
      next(error);
    }
  }

  async getWageById(req, res, next) {
    try {
      const record = await wageService.getWageById(req.params.id, req.user);
      res.status(200).json({
        success: true,
        data: record
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const summary = await wageService.getPayrollSummary(req.query);
      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WageController();
