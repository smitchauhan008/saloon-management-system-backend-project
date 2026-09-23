const Customer = require('../models/Customer');

class CustomerRepository {
  async findAndPage(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const query = {};

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const total = await Customer.countDocuments(query);
    const customers = await Customer.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ created_at: -1 });

    return {
      customers,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  async findById(id) {
    return await Customer.findById(id);
  }

  async create(customerData) {
    const customer = new Customer(customerData);
    return await customer.save();
  }

  async update(id, customerData) {
    return await Customer.findByIdAndUpdate(id, customerData, {
      new: true,
      runValidators: true
    });
  }

  async delete(id) {
    return await Customer.findByIdAndDelete(id);
  }
}

module.exports = new CustomerRepository();
