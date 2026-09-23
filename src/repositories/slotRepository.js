const CalendarException = require('../models/CalendarException');
const Appointment = require('../models/Appointment');

class SlotRepository {
  /**
   * Find calendar exceptions (holidays/blocks) affecting a given date and optional barber
   */
  async findExceptionsForDate(dateStr, barberId = null) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const query = {
      date: { $gte: start, $lte: end }
    };

    if (barberId) {
      // Exception applies if it's salon-wide (barber_id is null) OR matches specific barber
      query.$or = [{ barber_id: null }, { barber_id: barberId }];
    }

    return await CalendarException.find(query).sort({ start_time: 1 });
  }

  /**
   * List all exceptions/holidays (e.g. for management table)
   */
  async findAllExceptions(filters = {}) {
    const query = {};
    if (filters.type) {
      query.type = filters.type;
    }
    return await CalendarException.find(query)
      .populate({
        path: 'barber_id',
        populate: { path: 'user_id', select: 'name email' }
      })
      .populate('created_by', 'name email role')
      .sort({ date: 1, start_time: 1 });
  }

  async findExceptionById(id) {
    return await CalendarException.findById(id);
  }

  async createException(data) {
    const exception = new CalendarException(data);
    return await exception.save();
  }

  async deleteException(id) {
    return await CalendarException.findByIdAndDelete(id);
  }

  /**
   * Find all active appointments for a barber on a date to check for overlaps
   */
  async findActiveAppointmentsForBarber(barberId, dateStr, excludeAppointmentId = null) {
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    const query = {
      barber_id: barberId,
      status: { $ne: 'Cancelled' },
      appointment_date: { $gte: start, $lte: end }
    };

    if (excludeAppointmentId) {
      query._id = { $ne: excludeAppointmentId };
    }

    return await Appointment.find(query)
      .populate('service_id', 'service_name name duration price')
      .populate('customer_id', 'name phone')
      .sort({ appointment_date: 1 });
  }
}

module.exports = new SlotRepository();
