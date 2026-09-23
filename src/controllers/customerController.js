const customerService = require('../services/customerService');

class CustomerController {
  async getCustomers(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const result = await customerService.getCustomers({ search }, page, limit);
      res.status(200).json({
        success: true,
        data: result.customers,
        pagination: {
          total: result.total,
          page: result.page,
          pages: result.pages
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getCustomerById(req, res, next) {
    try {
      const customer = await customerService.getCustomerById(req.params.id);
      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async createCustomer(req, res, next) {
    try {
      const customer = await customerService.createCustomer(req.body);
      res.status(201).json({
        success: true,
        data: customer
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req, res, next) {
    try {
      const customer = await customerService.updateCustomer(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: customer
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteCustomer(req, res, next) {
    try {
      await customerService.deleteCustomer(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Customer profile removed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new CustomerController();
