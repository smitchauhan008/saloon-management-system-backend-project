const attendanceRepository = require('../repositories/attendanceRepository');
const barberRepository = require('../repositories/barberRepository');
const Barber = require('../models/Barber');

class AttendanceService {
  /**
   * Helper to resolve the target barber profile
   */
  async resolveBarberId(user, explicitBarberId = null) {
    if (user.role === 'Barber') {
      const barber = await Barber.findOne({ user_id: user._id });
      if (!barber) {
        throw new Error('Barber stylist profile not found for the logged-in user');
      }
      return barber._id;
    }

    if (user.role === 'Administrator') {
      if (explicitBarberId) {
        const barber = await barberRepository.findById(explicitBarberId);
        if (!barber) {
          throw new Error('Target barber stylist profile does not exist');
        }
        return barber._id;
      }
      // If admin didn't pass barber_id, check if admin has their own linked barber profile
      const barber = await Barber.findOne({ user_id: user._id });
      if (barber) return barber._id;

      throw new Error('Administrator must specify a target barber_id to record attendance');
    }

    throw new Error('User role is not authorized for attendance operations');
  }

  /**
   * Calculate shift metrics for an attendance document
   */
  formatAttendanceRecord(record) {
    const doc = record.toObject ? record.toObject() : { ...record };
    
    if (doc.check_in) {
      if (doc.check_out) {
        const diffMs = new Date(doc.check_out) - new Date(doc.check_in);
        const hours = Math.max(0, diffMs / (1000 * 60 * 60));
        doc.shift_duration_hours = parseFloat(hours.toFixed(2));
        doc.shift_status = 'Completed';
      } else {
        const diffMs = new Date() - new Date(doc.check_in);
        const hours = Math.max(0, diffMs / (1000 * 60 * 60));
        doc.shift_duration_hours = parseFloat(hours.toFixed(2));
        doc.shift_status = 'In Shift';
      }
    } else {
      doc.shift_duration_hours = 0;
      doc.shift_status = 'Pending';
    }

    return doc;
  }

  /**
   * 1. Check-In: Open a daily attendance card
   */
  async checkIn(user, data = {}) {
    const barberId = await this.resolveBarberId(user, data.barber_id);
    const checkInTime = data.check_in ? new Date(data.check_in) : new Date();

    // Check if an attendance card already exists for this barber today
    const existing = await attendanceRepository.findExistingForDate(barberId, checkInTime);
    if (existing) {
      throw new Error('Already checked in for this date. Check-in can only be recorded once per day.');
    }

    const created = await attendanceRepository.create({
      barber_id: barberId,
      check_in: checkInTime,
      check_out: null,
      date: checkInTime
    });

    return this.formatAttendanceRecord(created);
  }

  /**
   * 2. Check-Out: Close the active time card & compute daily shift
   */
  async checkOut(user, data = {}) {
    const barberId = await this.resolveBarberId(user, data.barber_id);
    const checkOutTime = data.check_out ? new Date(data.check_out) : new Date();

    // Locate active check-in where check_out is null for today
    const activeRecord = await attendanceRepository.findActiveCheckIn(barberId, checkOutTime);
    if (!activeRecord) {
      throw new Error('No active open timecard found for today to check out. Please check in first.');
    }

    if (checkOutTime < new Date(activeRecord.check_in)) {
      throw new Error('Check-out timestamp cannot be earlier than check-in timestamp.');
    }

    const updated = await attendanceRepository.update(activeRecord._id, {
      check_out: checkOutTime
    });

    return this.formatAttendanceRecord(updated);
  }

  /**
   * 3. Matrix Review: Fetch attendance records with RBAC scoping
   */
  async getAttendance(user, filters = {}) {
    const queryFilters = { ...filters };

    // RBAC: Barber can only view their own personal attendance
    if (user.role === 'Barber') {
      const barber = await Barber.findOne({ user_id: user._id });
      if (!barber) return [];
      queryFilters.barber_id = barber._id.toString();
    }

    const records = await attendanceRepository.findAll(queryFilters);
    return records.map(r => this.formatAttendanceRecord(r));
  }

  /**
   * 4. Operational Compliance Summary Reporting
   * Aggregates shift hours, completed shifts, and active personnel
   */
  async getSummary(user, filters = {}) {
    const records = await this.getAttendance(user, filters);

    let totalCompletedHours = 0;
    let completedShiftsCount = 0;
    let activeShiftsCount = 0;

    const staffMap = {};

    records.forEach(r => {
      const barberId = r.barber_id?._id?.toString() || 'unknown';
      const barberName = r.barber_id?.user_id?.name || 'Stylist';

      if (!staffMap[barberId]) {
        staffMap[barberId] = {
          barber_id: barberId,
          barber_name: barberName,
          total_hours: 0,
          completed_shifts: 0,
          active_shifts: 0
        };
      }

      if (r.check_out) {
        totalCompletedHours += r.shift_duration_hours;
        completedShiftsCount += 1;
        staffMap[barberId].total_hours += r.shift_duration_hours;
        staffMap[barberId].completed_shifts += 1;
      } else {
        activeShiftsCount += 1;
        staffMap[barberId].active_shifts += 1;
      }
    });

    Object.keys(staffMap).forEach(key => {
      staffMap[key].total_hours = parseFloat(staffMap[key].total_hours.toFixed(2));
      staffMap[key].average_hours_per_shift = staffMap[key].completed_shifts > 0
        ? parseFloat((staffMap[key].total_hours / staffMap[key].completed_shifts).toFixed(2))
        : 0;
    });

    return {
      total_records: records.length,
      completed_shifts: completedShiftsCount,
      active_shifts_now: activeShiftsCount,
      total_hours_worked: parseFloat(totalCompletedHours.toFixed(2)),
      average_hours_per_shift: completedShiftsCount > 0
        ? parseFloat((totalCompletedHours / completedShiftsCount).toFixed(2))
        : 0,
      staff_breakdown: Object.values(staffMap)
    };
  }
}

module.exports = new AttendanceService();
