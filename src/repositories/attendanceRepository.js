const Attendance = require('../models/Attendance');

class AttendanceRepository {
  /**
   * Helper to populate barber and user identity
   */
  _applyPopulate(query) {
    return query.populate({
      path: 'barber_id',
      select: 'user_id specialization commission_percentage joining_date',
      populate: { path: 'user_id', select: 'name email role status' }
    });
  }

  /**
   * Find open check-in timecard for a barber on a given date (where check_out is null)
   */
  async findActiveCheckIn(barberId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      barber_id: barberId,
      date: { $gte: startOfDay, $lte: endOfDay },
      check_out: null
    };

    return await this._applyPopulate(Attendance.findOne(query));
  }

  /**
   * Check if any attendance record exists for the barber on this day
   */
  async findExistingForDate(barberId, date = new Date()) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      barber_id: barberId,
      date: { $gte: startOfDay, $lte: endOfDay }
    };

    return await this._applyPopulate(Attendance.findOne(query));
  }

  /**
   * Multi-criteria query for attendance matrix review
   */
  async findAll(filters = {}) {
    const query = {};

    if (filters.barber_id) {
      query.barber_id = filters.barber_id;
    }

    if (filters.date) {
      const start = new Date(filters.date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(filters.date);
      end.setHours(23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    } else if (filters.startDate || filters.endDate) {
      query.date = {};
      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        query.date.$gte = start;
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    return await this._applyPopulate(
      Attendance.find(query).sort({ date: -1, check_in: -1 })
    );
  }

  async findById(id) {
    return await this._applyPopulate(Attendance.findById(id));
  }

  async create(attendanceData) {
    const attendance = new Attendance(attendanceData);
    const saved = await attendance.save();
    return await this.findById(saved._id);
  }

  async update(id, updateData) {
    await Attendance.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return await this.findById(id);
  }

  async delete(id) {
    return await Attendance.findByIdAndDelete(id);
  }
}

module.exports = new AttendanceRepository();
