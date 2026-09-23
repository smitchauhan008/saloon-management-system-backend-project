const attendanceService = require('../services/attendanceService');

class AttendanceController {
  async checkIn(req, res, next) {
    try {
      const record = await attendanceService.checkIn(req.user, req.body);
      res.status(201).json({
        success: true,
        message: 'Checked in successfully. Daily timecard opened.',
        data: record
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async checkOut(req, res, next) {
    try {
      const record = await attendanceService.checkOut(req.user, req.body);
      res.status(200).json({
        success: true,
        message: `Checked out successfully. Shift completed (${record.shift_duration_hours} hrs).`,
        data: record
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async getAttendance(req, res, next) {
    try {
      const { barber_id, date, startDate, endDate } = req.query;
      const records = await attendanceService.getAttendance(req.user, {
        barber_id,
        date,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        count: records.length,
        data: records
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req, res, next) {
    try {
      const { barber_id, date, startDate, endDate } = req.query;
      const summary = await attendanceService.getSummary(req.user, {
        barber_id,
        date,
        startDate,
        endDate
      });

      res.status(200).json({
        success: true,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AttendanceController();
