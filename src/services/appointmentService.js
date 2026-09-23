const appointmentRepository = require('../repositories/appointmentRepository');
const customerRepository = require('../repositories/customerRepository');
const barberRepository = require('../repositories/barberRepository');
const serviceRepository = require('../repositories/serviceRepository');
const slotService = require('./slotService');

class AppointmentService {
  /**
   * Allowed status lifecycle pipeline transitions
   */
  validateStatusTransition(currentStatus, newStatus) {
    if (currentStatus === newStatus) return true;

    const allowedTransitions = {
      'Pending': ['Confirmed', 'Cancelled'],
      'Confirmed': ['In Progress', 'Cancelled'],
      'In Progress': ['Completed', 'Cancelled'],
      'Completed': [], // Terminal state
      'Cancelled': ['Pending'] // Allow reopening a cancelled booking
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new Error(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Valid next stages: ${
          allowed.length ? allowed.join(', ') : 'None (Terminal state)'
        }`
      );
    }
    return true;
  }

  async getAllAppointments(filters) {
    return await appointmentRepository.findAll(filters);
  }

  async getAppointmentById(id) {
    const appointment = await appointmentRepository.findById(id);
    if (!appointment) {
      throw new Error('Appointment reservation not found');
    }
    return appointment;
  }

  async createAppointment(appointmentData) {
    // 1. Verify customer exists
    const customer = await customerRepository.findById(appointmentData.customer_id);
    if (!customer) {
      throw new Error('Referenced customer does not exist in the database');
    }

    // 2. Verify barber stylist profile exists
    const barber = await barberRepository.findById(appointmentData.barber_id);
    if (!barber) {
      throw new Error('Referenced barber stylist profile does not exist');
    }

    // 3. Verify service exists
    const service = await serviceRepository.findById(appointmentData.service_id);
    if (!service) {
      throw new Error('Referenced service package does not exist');
    }

    const serviceDuration = service.duration || 30;
    const dateStr = new Date(appointmentData.appointment_date).toISOString().split('T')[0];
    const timeStr = appointmentData.appointment_time;

    // 4. Week 8 Engine: Validate Calendar Exceptions, Shift Window, and Overlaps
    if (timeStr) {
      // 4a. Calendar Exception Validator (Holidays / Blocks)
      await slotService.validateCalendarExceptions(dateStr, appointmentData.barber_id, timeStr, serviceDuration);

      // 4b. Shift Window Validation Helper (Operating hours check)
      slotService.validateShiftWindow(timeStr, serviceDuration);

      // 4c. Double-Booking Overlap Checker (Stylist collision prevention)
      await slotService.checkDoubleBookingOverlap(
        appointmentData.barber_id,
        dateStr,
        timeStr,
        serviceDuration
      );
    }

    // 5. Default status strictly to 'Pending' as required by Module 5.5
    const status = appointmentData.status || 'Pending';

    // 6. Construct precise appointment datetime
    let appointmentDateObj = new Date(appointmentData.appointment_date);
    if (appointmentData.appointment_time) {
      const [hours, minutes] = appointmentData.appointment_time.split(':');
      if (hours !== undefined && minutes !== undefined) {
        appointmentDateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      }
    }

    // 7. Execute atomic reservation write with transaction wrapper
    return await appointmentRepository.createWithTransaction({
      ...appointmentData,
      status,
      appointment_date: appointmentDateObj
    });
  }

  async updateAppointment(id, appointmentData) {
    const existing = await appointmentRepository.findById(id);
    if (!existing) {
      throw new Error('Appointment not found');
    }

    // Verify foreign key integrity if changed
    let customer = null;
    let barber = null;
    let service = null;

    if (appointmentData.customer_id) {
      customer = await customerRepository.findById(appointmentData.customer_id);
      if (!customer) throw new Error('Referenced customer does not exist');
    }
    const targetBarberId = appointmentData.barber_id || existing.barber_id?._id || existing.barber_id;
    if (appointmentData.barber_id) {
      barber = await barberRepository.findById(appointmentData.barber_id);
      if (!barber) throw new Error('Referenced barber does not exist');
    }

    const targetServiceId = appointmentData.service_id || existing.service_id?._id || existing.service_id;
    service = await serviceRepository.findById(targetServiceId);
    const serviceDuration = service?.duration || 30;

    // Validate lifecycle status transition if status is being updated
    if (appointmentData.status && appointmentData.status !== existing.status) {
      this.validateStatusTransition(existing.status, appointmentData.status);
    }

    const data = { ...appointmentData };

    // Format datetime if updated
    let targetDateStr = existing.appointment_date ? new Date(existing.appointment_date).toISOString().split('T')[0] : '';
    let targetTimeStr = existing.appointment_time;

    if (data.appointment_date) {
      targetDateStr = new Date(data.appointment_date).toISOString().split('T')[0];
    }
    if (data.appointment_time !== undefined) {
      targetTimeStr = data.appointment_time;
    }

    // If rescheduling date/time, validate conflict engine if not cancelled
    const nextStatus = data.status || existing.status;
    if (nextStatus !== 'Cancelled' && (data.appointment_date || data.appointment_time || data.barber_id || data.service_id)) {
      if (targetTimeStr) {
        await slotService.validateCalendarExceptions(targetDateStr, targetBarberId, targetTimeStr, serviceDuration);
        slotService.validateShiftWindow(targetTimeStr, serviceDuration);
        await slotService.checkDoubleBookingOverlap(
          targetBarberId,
          targetDateStr,
          targetTimeStr,
          serviceDuration,
          existing._id
        );
      }
    }

    if (data.appointment_date || data.appointment_time) {
      let appointmentDateObj = new Date(targetDateStr);
      if (targetTimeStr) {
        const [hours, minutes] = targetTimeStr.split(':');
        if (hours !== undefined && minutes !== undefined) {
          appointmentDateObj.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        }
      }
      data.appointment_date = appointmentDateObj;
    }

    const appointment = await appointmentRepository.update(id, data);
    if (!appointment) {
      throw new Error('Appointment failed to update');
    }
    return appointment;
  }

  async updateStatus(id, newStatus, remarks) {
    const existing = await appointmentRepository.findById(id);
    if (!existing) {
      throw new Error('Appointment reservation not found');
    }

    this.validateStatusTransition(existing.status, newStatus);
    return await appointmentRepository.updateStatus(id, newStatus, remarks);
  }

  async deleteAppointment(id) {
    const existing = await appointmentRepository.findById(id);
    if (!existing) {
      throw new Error('Appointment reservation not found or already deleted');
    }
    return await appointmentRepository.delete(id);
  }
}

module.exports = new AppointmentService();
