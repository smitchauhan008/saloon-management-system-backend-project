const appointmentService = require('../services/appointmentService');

class AppointmentController {
  async getAllAppointments(req, res, next) {
    try {
      const {
        date,
        startDate,
        endDate,
        status,
        barber_id,
        customer_id,
        service_id,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const appointments = await appointmentService.getAllAppointments({
        date,
        startDate,
        endDate,
        status,
        barber_id,
        customer_id,
        service_id,
        page,
        limit,
        sortBy,
        sortOrder
      });

      res.status(200).json({
        success: true,
        count: appointments.length,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }

  async getAppointmentById(req, res, next) {
    try {
      const appointment = await appointmentService.getAppointmentById(req.params.id);
      res.status(200).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        message: error.message
      });
    }
  }

  async createAppointment(req, res, next) {
    try {
      const appointment = await appointmentService.createAppointment(req.body);
      res.status(201).json({
        success: true,
        message: 'Appointment scheduled successfully',
        data: appointment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateAppointment(req, res, next) {
    try {
      const appointment = await appointmentService.updateAppointment(req.params.id, req.body);
      res.status(200).json({
        success: true,
        message: 'Appointment updated successfully',
        data: appointment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateAppointmentStatus(req, res, next) {
    try {
      const { status, remarks } = req.body;
      const appointment = await appointmentService.updateStatus(req.params.id, status, remarks);
      res.status(200).json({
        success: true,
        message: `Appointment status transitioned to '${status}' successfully`,
        data: appointment
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  async deleteAppointment(req, res, next) {
    try {
      await appointmentService.deleteAppointment(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Appointment reservation removed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new AppointmentController();
