const customerRepository = require('../repositories/customerRepository');

class CustomerService {
  async getCustomers(filters, page, limit) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    return await customerRepository.findAndPage(filters, pageNum, limitNum);
  }

  async getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) {
      throw new Error('Customer not found');
    }
    return customer;
  }

  async createCustomer(customerData) {
    return await customerRepository.create(customerData);
  }

  async updateCustomer(id, customerData) {
    const customer = await customerRepository.update(id, customerData);
    if (!customer) {
      throw new Error('Customer not found or failed to update');
    }
    return customer;
  }

  async deleteCustomer(id) {
    const customer = await customerRepository.delete(id);
    if (!customer) {
      throw new Error('Customer not found or failed to delete');
    }
    return customer;
  }
}

module.exports = new CustomerService();
