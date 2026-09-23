const slotRepository = require('../repositories/slotRepository');
const serviceRepository = require('../repositories/serviceRepository');
const barberRepository = require('../repositories/barberRepository');

const DEFAULT_SHIFT_START = '09:00';
const DEFAULT_SHIFT_END = '19:00';

class SlotService {
  /**
   * Helper: Parse "HH:MM" into minutes from start of day
   */
  timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Helper: Convert minutes from start of day to "HH:MM"
   */
  minutesToTime(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * 1. Calendar Exception Validator
   * Checks if date/time violates official business holidays or blocked maintenance windows
   */
  async validateCalendarExceptions(dateStr, barberId = null, startTime = null, durationMinutes = 30) {
    const exceptions = await slotRepository.findExceptionsForDate(dateStr, barberId);

    if (!exceptions || exceptions.length === 0) {
      return true;
    }

    const requestedStartMin = startTime ? this.timeToMinutes(startTime) : 0;
    const requestedEndMin = startTime ? requestedStartMin + durationMinutes : 1440;

    for (const exc of exceptions) {
      // Full-day holiday or block
      if (!exc.start_time || !exc.end_time) {
        throw new Error(`Calendar Exception: Salon is closed on ${dateStr} for '${exc.reason}' (${exc.type}).`);
      }

      // Partial-day block
      const blockStartMin = this.timeToMinutes(exc.start_time);
      const blockEndMin = this.timeToMinutes(exc.end_time);

      if (startTime) {
        const hasOverlap = requestedStartMin < blockEndMin && requestedEndMin > blockStartMin;
        if (hasOverlap) {
          throw new Error(
            `Calendar Exception: Requested slot (${startTime} - ${this.minutesToTime(requestedEndMin)}) overlaps with blocked operational window (${exc.start_time} - ${exc.end_time}) for '${exc.reason}'.`
          );
        }
      }
    }

    return true;
  }

  /**
   * 2. Shift Window Validation Helper
   * Verifies that requested service start and end times fall strictly within operating shift hours
   */
  validateShiftWindow(startTime, durationMinutes, shiftStart = DEFAULT_SHIFT_START, shiftEnd = DEFAULT_SHIFT_END) {
    if (!startTime) {
      throw new Error('Shift Window Validation: Appointment start time is required.');
    }

    const startMin = this.timeToMinutes(startTime);
    const endMin = startMin + durationMinutes;
    const shiftStartMin = this.timeToMinutes(shiftStart);
    const shiftEndMin = this.timeToMinutes(shiftEnd);

    if (startMin < shiftStartMin) {
      throw new Error(
        `Shift Window Violation: Start time ${startTime} is before salon opening hours (${shiftStart}).`
      );
    }

    if (endMin > shiftEndMin) {
      throw new Error(
        `Shift Window Violation: Service finishes at ${this.minutesToTime(endMin)}, which extends beyond shift closing hours (${shiftEnd}).`
      );
    }

    return true;
  }

  /**
   * 3. Double-Booking Overlap Checker
   * Intercepts execution to ensure a stylist is never assigned overlapping appointments
   */
  async checkDoubleBookingOverlap(barberId, dateStr, startTime, durationMinutes, excludeAppointmentId = null) {
    if (!barberId || !dateStr || !startTime) return true;

    const requestedStartMin = this.timeToMinutes(startTime);
    const requestedEndMin = requestedStartMin + durationMinutes;

    const existingAppointments = await slotRepository.findActiveAppointmentsForBarber(
      barberId,
      dateStr,
      excludeAppointmentId
    );

    for (const appt of existingAppointments) {
      // Determine existing appointment start time
      let apptStartStr = appt.appointment_time;
      if (!apptStartStr && appt.appointment_date) {
        const dt = new Date(appt.appointment_date);
        apptStartStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      }

      if (!apptStartStr) continue;

      const apptStartMin = this.timeToMinutes(apptStartStr);
      const apptDuration = appt.service_id?.duration || 30;
      const apptEndMin = apptStartMin + apptDuration;

      // Interval overlap check: StartA < EndB && EndA > StartB
      const hasOverlap = requestedStartMin < apptEndMin && requestedEndMin > apptStartMin;

      if (hasOverlap) {
        const servName = appt.service_id?.service_name || appt.service_id?.name || 'Service';
        throw new Error(
          `Double-Booking Collision: The requested stylist is already booked from ${apptStartStr} to ${this.minutesToTime(
            apptEndMin
          )} for '${servName}'.`
        );
      }
    }

    return true;
  }

  /**
   * 4. Comprehensive Slot Availability Engine (GET /api/slots)
   * Lists open available time windows for a barber on a given date
   */
  async getAvailableSlots({ barber_id, date, service_id }) {
    let serviceDuration = 30;
    if (service_id) {
      const service = await serviceRepository.findById(service_id);
      if (service && service.duration) {
        serviceDuration = service.duration;
      }
    }

    // Check exceptions / holidays for this date
    const exceptions = await slotRepository.findExceptionsForDate(date, barber_id);
    const fullDayHoliday = exceptions.find(e => !e.start_time || !e.end_time);

    if (fullDayHoliday) {
      return {
        date,
        barber_id: barber_id || null,
        is_holiday: true,
        holiday_reason: fullDayHoliday.reason,
        shift_hours: { start: DEFAULT_SHIFT_START, end: DEFAULT_SHIFT_END },
        available_slots: [],
        booked_slots: [],
        exceptions
      };
    }

    // Fetch existing active bookings for this barber on this date
    const bookedAppointments = barber_id 
      ? await slotRepository.findActiveAppointmentsForBarber(barber_id, date) 
      : [];

    const bookedSlots = bookedAppointments.map(appt => {
      let startStr = appt.appointment_time;
      if (!startStr && appt.appointment_date) {
        const dt = new Date(appt.appointment_date);
        startStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
      }
      const dur = appt.service_id?.duration || 30;
      const startMin = this.timeToMinutes(startStr);
      const endMin = startMin + dur;
      return {
        appointment_id: appt._id,
        customer_name: appt.customer_id?.name || 'Client',
        service_name: appt.service_id?.service_name || appt.service_id?.name || 'Service',
        start_time: startStr,
        end_time: this.minutesToTime(endMin),
        start_min: startMin,
        end_min: endMin
      };
    });

    // Generate time grid in 15-minute increments between shift start and end
    const shiftStartMin = this.timeToMinutes(DEFAULT_SHIFT_START);
    const shiftEndMin = this.timeToMinutes(DEFAULT_SHIFT_END);
    const slotStepMinutes = 15;

    const availableSlots = [];

    for (let currentMin = shiftStartMin; currentMin + serviceDuration <= shiftEndMin; currentMin += slotStepMinutes) {
      const candidateStartMin = currentMin;
      const candidateEndMin = currentMin + serviceDuration;

      // 1. Check overlap with booked appointments
      const overlapsBooking = bookedSlots.some(
        b => candidateStartMin < b.end_min && candidateEndMin > b.start_min
      );
      if (overlapsBooking) continue;

      // 2. Check overlap with partial calendar exceptions
      const overlapsException = exceptions.some(exc => {
        if (!exc.start_time || !exc.end_time) return true;
        const bStart = this.timeToMinutes(exc.start_time);
        const bEnd = this.timeToMinutes(exc.end_time);
        return candidateStartMin < bEnd && candidateEndMin > bStart;
      });
      if (overlapsException) continue;

      availableSlots.push(this.minutesToTime(candidateStartMin));
    }

    return {
      date,
      barber_id: barber_id || null,
      is_holiday: false,
      shift_hours: { start: DEFAULT_SHIFT_START, end: DEFAULT_SHIFT_END },
      service_duration: serviceDuration,
      available_slots: availableSlots,
      booked_slots: bookedSlots,
      exceptions
    };
  }

  async createSlotBlock(data, userId) {
    return await slotRepository.createException({
      ...data,
      created_by: userId
    });
  }

  async getAllExceptions(filters) {
    return await slotRepository.findAllExceptions(filters);
  }

  async deleteException(id) {
    const existing = await slotRepository.findExceptionById(id);
    if (!existing) {
      throw new Error('Calendar exception not found');
    }
    return await slotRepository.deleteException(id);
  }
}

module.exports = new SlotService();
