const wageRepository = require('../repositories/wageRepository');

class WageService {
  /**
   * Helper: Parse month string (YYYY-MM) into UTC start and end dates
   */
  getMonthDateRange(monthStr) {
    const [yearStr, monthNumStr] = monthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthNumStr, 10) - 1; // 0-indexed for JS Date

    const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    // Day 0 of next month is the last day of the target month
    const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

    return { startDate, endDate };
  }

  /**
   * Helper: Calculate monthly statement and commissions for a single barber
   */
  async calculateBarberMonthlyStatement(barberDoc, monthStr) {
    const { startDate, endDate } = this.getMonthDateRange(monthStr);
    const appointments = await wageRepository.findCompletedAppointments(barberDoc._id, startDate, endDate);

    const commissionRate = Number(barberDoc.commission_percentage || 0) / 100;
    let totalServiceRevenue = 0;
    let totalCommission = 0;
    let totalRetainedRevenue = 0;

    const appointmentBreakdown = appointments.map((appt) => {
      const price = Number(appt.service_id?.price || 0);
      const stylistCommission = Number((price * commissionRate).toFixed(2));
      const retainedRevenue = Number((price - stylistCommission).toFixed(2));

      totalServiceRevenue += price;
      totalCommission += stylistCommission;
      totalRetainedRevenue += retainedRevenue;

      return {
        appointment_id: appt._id,
        appointment_date: appt.appointment_date,
        service_name: appt.service_id?.service_name || appt.service_id?.name || 'Service',
        service_price: price,
        customer_name: appt.customer_id?.name || 'Customer',
        customer_phone: appt.customer_id?.phone || '',
        commission_percentage: barberDoc.commission_percentage,
        stylist_commission: stylistCommission,
        retained_revenue: retainedRevenue
      };
    });

    // Check if an official finalized wage record already exists
    const existingWageRecord = await wageRepository.findByBarberAndMonth(barberDoc._id, monthStr);

    return {
      barber_id: barberDoc._id,
      stylist_name: barberDoc.user_id?.name || 'Stylist',
      stylist_email: barberDoc.user_id?.email || '',
      specialization: barberDoc.specialization || 'General',
      commission_percentage: barberDoc.commission_percentage,
      month: monthStr,
      completed_appointments_count: appointments.length,
      total_service_revenue: Number(totalServiceRevenue.toFixed(2)),
      total_commission: Number(totalCommission.toFixed(2)),
      total_retained_revenue: Number(totalRetainedRevenue.toFixed(2)),
      is_finalized: !!existingWageRecord,
      finalized_record: existingWageRecord || null,
      appointments: appointmentBreakdown
    };
  }

  /**
   * Live Payroll & Commission Calculations
   * Module 5.8: GET /api/wages (with calculation / preview)
   */
  async calculatePayroll(query = {}, user) {
    const month = query.month || new Date().toISOString().substring(0, 7);

    // Section 4 RBAC: Barber can only view personal calculation
    if (user.role === 'Barber') {
      const barber = await wageRepository.findBarberByUserId(user._id);
      if (!barber) {
        throw new Error('Barber profile not found for this user account');
      }
      const statement = await this.calculateBarberMonthlyStatement(barber, month);
      return {
        month,
        statements: [statement],
        summary: {
          total_revenue: statement.total_service_revenue,
          total_commissions: statement.total_commission,
          total_retained: statement.total_retained_revenue,
          total_completed_appointments: statement.completed_appointments_count
        }
      };
    }

    // Administrator: Can calculate for specific barber or all barbers
    if (query.barber_id) {
      const barber = await wageRepository.findBarberById(query.barber_id);
      if (!barber) {
        throw new Error('Barber profile not found');
      }
      const statement = await this.calculateBarberMonthlyStatement(barber, month);
      return {
        month,
        statements: [statement],
        summary: {
          total_revenue: statement.total_service_revenue,
          total_commissions: statement.total_commission,
          total_retained: statement.total_retained_revenue,
          total_completed_appointments: statement.completed_appointments_count
        }
      };
    }

    // All barbers across salon
    const barbers = await wageRepository.findAllBarbers();
    const statements = await Promise.all(
      barbers.map((b) => this.calculateBarberMonthlyStatement(b, month))
    );

    let totalRevenue = 0;
    let totalCommissions = 0;
    let totalRetained = 0;
    let totalCompleted = 0;

    for (const stmt of statements) {
      totalRevenue += stmt.total_service_revenue;
      totalCommissions += stmt.total_commission;
      totalRetained += stmt.total_retained_revenue;
      totalCompleted += stmt.completed_appointments_count;
    }

    return {
      month,
      statements,
      summary: {
        total_revenue: Number(totalRevenue.toFixed(2)),
        total_commissions: Number(totalCommissions.toFixed(2)),
        total_retained: Number(totalRetained.toFixed(2)),
        total_completed_appointments: totalCompleted,
        total_staff_count: barbers.length
      }
    };
  }

  /**
   * Finalize Monthly Balance Tables & Record Payouts
   * Module 5.8: POST /api/wages
   */
  async finalizePayroll(payload, user) {
    if (user.role !== 'Administrator') {
      const err = new Error('Access Denied: Only Administrators can finalize monthly wage records');
      err.status = 403;
      throw err;
    }

    const { barber_id, month, salary = 0, commission } = payload;

    const barber = await wageRepository.findBarberById(barber_id);
    if (!barber) {
      const err = new Error('Barber profile not found');
      err.status = 404;
      throw err;
    }

    let finalCommission = 0;

    if (commission !== undefined && commission !== null) {
      finalCommission = Number(commission);
    } else {
      // Auto-calculate from completed service transactions
      const statement = await this.calculateBarberMonthlyStatement(barber, month);
      finalCommission = statement.total_commission;
    }

    const finalSalary = Number(salary);
    const totalAmount = Number((finalSalary + finalCommission).toFixed(2));

    // Persist finalized wage record (upsert guarantees idempotency)
    const wageRecord = await wageRepository.upsert(barber_id, month, {
      barber_id,
      month,
      salary: Number(finalSalary.toFixed(2)),
      commission: Number(finalCommission.toFixed(2)),
      total_amount: totalAmount
    });

    return {
      message: `Monthly wage statement finalized for ${month}`,
      wage_record: wageRecord
    };
  }

  /**
   * Get Finalized Wage Records (Historical Ledger)
   */
  async getAllWages(query = {}, user) {
    const filter = {};

    if (query.month) {
      filter.month = query.month;
    }

    if (user.role === 'Barber') {
      const barber = await wageRepository.findBarberByUserId(user._id);
      if (!barber) {
        throw new Error('Barber profile not found for this user account');
      }
      filter.barber_id = barber._id;
    } else if (query.barber_id) {
      filter.barber_id = query.barber_id;
    }

    return await wageRepository.findAll(filter);
  }

  /**
   * Get Logged-in Barber's Wage History
   */
  async getMyWages(user) {
    const barber = await wageRepository.findBarberByUserId(user._id);
    if (!barber) {
      const err = new Error('Barber profile not found for this user account');
      err.status = 404;
      throw err;
    }

    return await wageRepository.findAll({ barber_id: barber._id });
  }

  /**
   * Get Specific Wage Record by ID
   */
  async getWageById(id, user) {
    const record = await wageRepository.findById(id);
    if (!record) {
      const err = new Error('Wage record not found');
      err.status = 404;
      throw err;
    }

    if (user.role === 'Barber') {
      const barber = await wageRepository.findBarberByUserId(user._id);
      if (!barber || String(record.barber_id._id) !== String(barber._id)) {
        const err = new Error('Access Denied: You can only view your own wage records');
        err.status = 403;
        throw err;
      }
    }

    return record;
  }

  /**
   * High-Level Executive Payroll Summary
   */
  async getPayrollSummary(query = {}) {
    const month = query.month || new Date().toISOString().substring(0, 7);
    const filter = { month };

    const records = await wageRepository.findAll(filter);
    const barbers = await wageRepository.findAllBarbers();

    let totalPayouts = 0;
    let totalBaseSalaries = 0;
    let totalCommissionsPaid = 0;

    for (const r of records) {
      totalPayouts += Number(r.total_amount || 0);
      totalBaseSalaries += Number(r.salary || 0);
      totalCommissionsPaid += Number(r.commission || 0);
    }

    return {
      month,
      finalized_payouts_count: records.length,
      total_barbers_count: barbers.length,
      total_payouts_distributed: Number(totalPayouts.toFixed(2)),
      total_base_salaries: Number(totalBaseSalaries.toFixed(2)),
      total_commissions_paid: Number(totalCommissionsPaid.toFixed(2)),
      pending_barbers_count: Math.max(0, barbers.length - records.length)
    };
  }
}

module.exports = new WageService();
