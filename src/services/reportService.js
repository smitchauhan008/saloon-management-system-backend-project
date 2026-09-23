const reportRepository = require('../repositories/reportRepository');

class ReportService {
  /**
   * 1. GET /api/reports/daily-revenue
   * Computes summarized operational income metrics for the current business date
   */
  async getDailyRevenue(dateStr) {
    const targetDateStr = dateStr || new Date().toISOString().split('T')[0];
    const [year, month, day] = targetDateStr.split('-').map(Number);

    const startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));

    const appointments = await reportRepository.getDailyAppointments(startDate, endDate);

    let grossRevenue = 0;
    let stylistCommissions = 0;
    let completedCount = 0;
    let pendingCount = 0;
    let cancelledCount = 0;

    const hourlyMap = {};
    for (let h = 9; h <= 19; h++) {
      const hourKey = `${String(h).padStart(2, '0')}:00`;
      hourlyMap[hourKey] = {
        hour: hourKey,
        total_bookings: 0,
        completed_bookings: 0,
        hourly_revenue: 0
      };
    }

    const servicesMap = {};

    for (const appt of appointments) {
      const isCompleted = appt.status === 'Completed';
      const isCancelled = appt.status === 'Cancelled';

      if (isCompleted) {
        completedCount++;
        const price = Number(appt.service_id?.price || 0);
        const commRate = Number(appt.barber_id?.commission_percentage || 0) / 100;
        const stylistCut = Number((price * commRate).toFixed(2));

        grossRevenue += price;
        stylistCommissions += stylistCut;

        // Group by service
        const sName = appt.service_id?.service_name || appt.service_id?.name || 'Service';
        if (!servicesMap[sName]) {
          servicesMap[sName] = { service_name: sName, bookings: 0, revenue: 0 };
        }
        servicesMap[sName].bookings++;
        servicesMap[sName].revenue += price;
      } else if (isCancelled) {
        cancelledCount++;
      } else {
        pendingCount++;
      }

      // Map to hourly bucket
      const timeStr = appt.appointment_time || (appt.appointment_date ? appt.appointment_date.toISOString().substring(11, 16) : '09:00');
      const hourPart = timeStr.split(':')[0];
      const hourKey = `${hourPart}:00`;

      if (hourlyMap[hourKey]) {
        hourlyMap[hourKey].total_bookings++;
        if (isCompleted) {
          hourlyMap[hourKey].completed_bookings++;
          hourlyMap[hourKey].hourly_revenue += Number(appt.service_id?.price || 0);
        }
      }
    }

    const salonRetainedRevenue = Number((grossRevenue - stylistCommissions).toFixed(2));

    return {
      date: targetDateStr,
      metrics: {
        gross_revenue: Number(grossRevenue.toFixed(2)),
        stylist_commissions: Number(stylistCommissions.toFixed(2)),
        salon_retained_revenue: salonRetainedRevenue,
        total_appointments: appointments.length,
        completed_appointments: completedCount,
        pending_appointments: pendingCount,
        cancelled_appointments: cancelledCount,
        completion_rate_percentage: appointments.length > 0 
          ? Number(((completedCount / appointments.length) * 100).toFixed(1)) 
          : 0
      },
      hourly_breakdown: Object.values(hourlyMap),
      services_breakdown: Object.values(servicesMap).sort((a, b) => b.revenue - a.revenue)
    };
  }

  /**
   * 2. GET /api/reports/monthly-revenue
   * Computes income performance distributions across active fiscal terms
   */
  async getMonthlyRevenue(yearStr) {
    const year = parseInt(yearStr || new Date().getFullYear(), 10);
    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const aggregatedMonths = await reportRepository.getMonthlyRevenueAggregation(startOfYear, endOfYear);

    // Build contiguous 12-month array
    const monthDataMap = {};
    for (const item of aggregatedMonths) {
      monthDataMap[item.month] = item;
    }

    const fullYearMonths = [];
    let fiscalGrossRevenue = 0;
    let fiscalCommissionsPaid = 0;
    let fiscalNetRevenue = 0;
    let fiscalTotalAppointments = 0;
    let highestMonth = null;
    let highestRevenue = -1;

    for (let m = 1; m <= 12; m++) {
      const monthStr = `${year}-${String(m).padStart(2, '0')}`;
      const entry = monthDataMap[monthStr] || {
        month: monthStr,
        total_appointments: 0,
        gross_revenue: 0,
        commissions_paid: 0,
        net_salon_revenue: 0
      };

      fullYearMonths.push(entry);

      fiscalGrossRevenue += entry.gross_revenue;
      fiscalCommissionsPaid += entry.commissions_paid;
      fiscalNetRevenue += entry.net_salon_revenue;
      fiscalTotalAppointments += entry.total_appointments;

      if (entry.gross_revenue > highestRevenue) {
        highestRevenue = entry.gross_revenue;
        highestMonth = monthStr;
      }
    }

    return {
      fiscal_year: year,
      fiscal_summary: {
        total_gross_revenue: Number(fiscalGrossRevenue.toFixed(2)),
        total_commissions_paid: Number(fiscalCommissionsPaid.toFixed(2)),
        total_net_salon_revenue: Number(fiscalNetRevenue.toFixed(2)),
        total_completed_appointments: fiscalTotalAppointments,
        average_monthly_revenue: Number((fiscalGrossRevenue / 12).toFixed(2)),
        highest_revenue_month: highestMonth || `${year}-01`,
        peak_month_revenue: Number(highestRevenue > -1 ? highestRevenue.toFixed(2) : '0.00')
      },
      monthly_breakdown: fullYearMonths
    };
  }

  /**
   * 3. GET /api/reports/top-services
   * Rank-orders standard menu options by total purchase volume to pinpoint high-margin items
   */
  async getTopServices(limit = 5) {
    const rawServices = await reportRepository.getTopServicesAggregation(limit);

    const totalRevenueAllTop = rawServices.reduce((sum, s) => sum + s.gross_revenue, 0);

    const services = rawServices.map((service, index) => {
      const sharePercentage = totalRevenueAllTop > 0
        ? Number(((service.gross_revenue / totalRevenueAllTop) * 100).toFixed(1))
        : 0;

      return {
        rank: index + 1,
        service_id: service.service_id,
        service_name: service.service_name || 'Hair Treatment',
        unit_price: service.price || 0,
        duration_minutes: service.duration || 30,
        total_bookings: service.total_bookings,
        gross_revenue: service.gross_revenue,
        revenue_share_percentage: sharePercentage
      };
    });

    return {
      total_ranked: services.length,
      top_services: services
    };
  }

  /**
   * 4. GET /api/reports/barber-performance
   * Summarizes appointment tracking metrics, total hours worked, and accumulated sales commissions for each stylist
   */
  async getBarberPerformance() {
    const [salesList, hoursList, allBarbers] = await Promise.all([
      reportRepository.getBarberSalesAggregation(),
      reportRepository.getAttendanceHoursAggregation(),
      reportRepository.getAllBarbers()
    ]);

    const salesMap = {};
    for (const s of salesList) {
      salesMap[String(s.barber_id)] = s;
    }

    const hoursMap = {};
    for (const h of hoursList) {
      hoursMap[String(h.barber_id)] = h;
    }

    let totalSalonStylistSales = 0;
    let totalSalonStylistCommissions = 0;

    const performanceMatrix = allBarbers.map((barber) => {
      const bId = String(barber._id);
      const sales = salesMap[bId] || { completed_appointments_count: 0, gross_sales_generated: 0, accumulated_commissions: 0, salon_retained_earnings: 0 };
      const hours = hoursMap[bId] || { total_hours_worked: 0, total_shifts_count: 0 };

      totalSalonStylistSales += sales.gross_sales_generated;
      totalSalonStylistCommissions += sales.accumulated_commissions;

      const hourlyRate = hours.total_hours_worked > 0
        ? Number((sales.gross_sales_generated / hours.total_hours_worked).toFixed(2))
        : 0;

      return {
        barber_id: barber._id,
        stylist_name: barber.user_id?.name || 'Stylist',
        stylist_email: barber.user_id?.email || '',
        specialization: barber.specialization || 'General',
        commission_percentage: barber.commission_percentage || 40,
        completed_appointments_count: sales.completed_appointments_count,
        gross_sales_generated: sales.gross_sales_generated,
        accumulated_commissions: sales.accumulated_commissions,
        salon_retained_earnings: sales.salon_retained_earnings,
        total_hours_worked: hours.total_hours_worked,
        total_shifts_count: hours.total_shifts_count,
        hourly_productivity_rate: hourlyRate
      };
    });

    performanceMatrix.sort((a, b) => b.gross_sales_generated - a.gross_sales_generated);

    // Identify top performing stylist
    const topPerformer = performanceMatrix.length > 0 ? performanceMatrix[0] : null;

    return {
      total_staff_count: performanceMatrix.length,
      salon_totals: {
        total_stylist_sales: Number(totalSalonStylistSales.toFixed(2)),
        total_commissions_accrued: Number(totalSalonStylistCommissions.toFixed(2)),
        top_stylist_name: topPerformer?.stylist_name || 'N/A'
      },
      stylists_performance: performanceMatrix
    };
  }

  /**
   * 5. GET /api/reports/customer-visits
   * Analyzes customer return rates and tracks client retention frequencies across different branches
   */
  async getCustomerVisits(limit = 10) {
    const [rawCustomers, totalRegisteredCustomers] = await Promise.all([
      reportRepository.getCustomerVisitsAggregation(),
      reportRepository.getTotalCustomersCount()
    ]);

    let repeatCount = 0;
    let oneTimeCount = 0;
    let totalAllSpend = 0;

    for (const c of rawCustomers) {
      totalAllSpend += c.total_spent;
      if (c.visit_count > 1) {
        repeatCount++;
      } else {
        oneTimeCount++;
      }
    }

    const customersWithVisits = rawCustomers.length;
    const retentionRate = customersWithVisits > 0
      ? Number(((repeatCount / customersWithVisits) * 100).toFixed(1))
      : 0;

    const averageSpendPerActiveCustomer = customersWithVisits > 0
      ? Number((totalAllSpend / customersWithVisits).toFixed(2))
      : 0;

    const topLoyalCustomers = rawCustomers.slice(0, limit);

    return {
      retention_metrics: {
        total_registered_customers: totalRegisteredCustomers,
        active_customers_with_visits: customersWithVisits,
        repeat_customers_count: repeatCount,
        one_time_customers_count: oneTimeCount,
        retention_rate_percentage: retentionRate,
        average_spend_per_customer: averageSpendPerActiveCustomer,
        total_customer_spend: Number(totalAllSpend.toFixed(2))
      },
      top_loyal_customers: topLoyalCustomers
    };
  }
}

module.exports = new ReportService();
