const mongoose = require('mongoose');
const Appointment = require('../models/Appointment');

class AppointmentRepository {
  /**
   * Helper to append deep relational populate chains to any appointment query
   */
  _applyPopulate(query) {
    return query
      .populate('customer_id', 'name phone email gender')
      .populate({
        path: 'barber_id',
        select: 'user_id specialization commission_percentage joining_date',
        populate: { path: 'user_id', select: 'name email role status' }
      })
      .populate('service_id', 'service_name name duration price description');
  }

  /**
   * Multi-criteria appointment finder
   * Supports: date, startDate, endDate, status, barber_id, customer_id, service_id
   */
  async findAll(filters = {}) {
    const query = {};

    // 1. Single date filter
    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      query.appointment_date = { $gte: start, $lte: end };
    } 
    // 2. Date range filter
    else if (filters.startDate || filters.endDate) {
      query.appointment_date = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        query.appointment_date.$gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.appointment_date.$lte = end;
      }
    }

    // 3. Status filter
    if (filters.status) {
      query.status = filters.status;
    }

    // 4. Entity references
    if (filters.barber_id) {
      query.barber_id = filters.barber_id;
    }
    if (filters.customer_id) {
      query.customer_id = filters.customer_id;
    }
    if (filters.service_id) {
      query.service_id = filters.service_id;
    }

    const sortOptions = filters.sortBy 
      ? { [filters.sortBy]: filters.sortOrder === 'desc' ? -1 : 1 } 
      : { appointment_date: 1 };

    let dbQuery = Appointment.find(query).sort(sortOptions);

    if (filters.limit) {
      const limit = parseInt(filters.limit, 10);
      const skip = filters.page ? (parseInt(filters.page, 10) - 1) * limit : 0;
      dbQuery = dbQuery.skip(skip).limit(limit);
    }

    return await this._applyPopulate(dbQuery);
  }

  async findById(id) {
    return await this._applyPopulate(Appointment.findById(id));
  }

  /**
   * Transaction wrapper to handle new reservation inserts atomically.
   * Gracefully falls back if running on a standalone single-node MongoDB instance.
   */
  async createWithTransaction(appointmentData) {
    let session = null;

    try {
      session = await mongoose.startSession();
      session.startTransaction();

      const [createdDoc] = await Appointment.create([appointmentData], { session });
      await session.commitTransaction();
      return await this.findById(createdDoc._id);
    } catch (error) {
      if (session) {
        try {
          await session.abortTransaction();
        } catch (_) {}
      }

      // Check if error is due to MongoDB running as standalone (non-replica set)
      if (
        error.code === 20 ||
        (error.message && error.message.includes('Transaction numbers are only allowed on a replica set member or mongos'))
      ) {
        // Fallback gracefully to standard atomic document creation for standalone setups
        const appointment = new Appointment(appointmentData);
        const createdDoc = await appointment.save();
        return await this.findById(createdDoc._id);
      }

      throw error;
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  async create(appointmentData) {
    return await this.createWithTransaction(appointmentData);
  }

  async update(id, appointmentData) {
    const updated = await Appointment.findByIdAndUpdate(id, appointmentData, {
      new: true,
      runValidators: true
    });
    if (!updated) return null;
    return await this.findById(id);
  }

  async updateStatus(id, status, remarks) {
    const updatePayload = { status };
    if (remarks !== undefined) {
      updatePayload.remarks = remarks;
    }
    const updated = await Appointment.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true
    });
    if (!updated) return null;
    return await this.findById(id);
  }

  async delete(id) {
    return await Appointment.findByIdAndDelete(id);
  }
}

module.exports = new AppointmentRepository();
