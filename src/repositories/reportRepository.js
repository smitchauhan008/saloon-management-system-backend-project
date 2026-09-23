const Appointment = require('../models/Appointment');
const Customer = require('../models/Customer');
const Barber = require('../models/Barber');
const Service = require('../models/Service');
const Attendance = require('../models/Attendance');

class ReportRepository {
  /**
   * Daily Appointments with details
   */
  async getDailyAppointments(startDate, endDate) {
    return await Appointment.find({
      appointment_date: {
        $gte: startDate,
        $lte: endDate
      }
    })
      .populate('service_id', 'service_name name price duration')
      .populate({
        path: 'barber_id',
        populate: { path: 'user_id', select: 'name email' }
      })
      .populate('customer_id', 'name phone email')
      .sort({ appointment_date: 1 });
  }

  /**
   * High-Performance Monthly Revenue Aggregation
   */
  async getMonthlyRevenueAggregation(startOfYear, endOfYear) {
    return await Appointment.aggregate([
      {
        $match: {
          status: 'Completed',
          appointment_date: {
            $gte: startOfYear,
            $lte: endOfYear
          }
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'service_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $lookup: {
          from: 'barbers',
          localField: 'barber_id',
          foreignField: '_id',
          as: 'barber'
        }
      },
      {
        $project: {
          month: {
            $dateToString: { format: '%Y-%m', date: '$appointment_date' }
          },
          price: { $ifNull: [{ $arrayElemAt: ['$service.price', 0] }, 0] },
          commission_percentage: { $ifNull: [{ $arrayElemAt: ['$barber.commission_percentage', 0] }, 0] }
        }
      },
      {
        $project: {
          month: 1,
          price: 1,
          stylist_commission: {
            $multiply: ['$price', { $divide: ['$commission_percentage', 100] }]
          }
        }
      },
      {
        $group: {
          _id: '$month',
          total_appointments: { $sum: 1 },
          gross_revenue: { $sum: '$price' },
          commissions_paid: { $sum: '$stylist_commission' }
        }
      },
      {
        $project: {
          month: '$_id',
          total_appointments: 1,
          gross_revenue: { $round: ['$gross_revenue', 2] },
          commissions_paid: { $round: ['$commissions_paid', 2] },
          net_salon_revenue: { $round: [{ $subtract: ['$gross_revenue', '$commissions_paid'] }, 2] }
        }
      },
      { $sort: { month: 1 } }
    ]);
  }

  /**
   * Rank-Order Top Services by Purchase Volume and Revenue
   */
  async getTopServicesAggregation(limit = 5) {
    return await Appointment.aggregate([
      {
        $match: {
          status: 'Completed'
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'service_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $project: {
          service_id: 1,
          service_doc: { $arrayElemAt: ['$service', 0] },
          price: { $ifNull: [{ $arrayElemAt: ['$service.price', 0] }, 0] }
        }
      },
      {
        $group: {
          _id: '$service_id',
          total_bookings: { $sum: 1 },
          gross_revenue: { $sum: '$price' },
          service_doc: { $first: '$service_doc' }
        }
      },
      {
        $project: {
          _id: 1,
          service_id: '$_id',
          service_name: { $ifNull: ['$service_doc.service_name', '$service_doc.name'] },
          price: '$service_doc.price',
          duration: '$service_doc.duration',
          total_bookings: 1,
          gross_revenue: { $round: ['$gross_revenue', 2] }
        }
      },
      { $sort: { total_bookings: -1, gross_revenue: -1 } },
      { $limit: limit }
    ]);
  }

  /**
   * Total Completed Appointments & Revenue by Barber
   */
  async getBarberSalesAggregation() {
    return await Appointment.aggregate([
      {
        $match: {
          status: 'Completed'
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'service_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $lookup: {
          from: 'barbers',
          localField: 'barber_id',
          foreignField: '_id',
          as: 'barber'
        }
      },
      {
        $project: {
          barber_id: 1,
          price: { $ifNull: [{ $arrayElemAt: ['$service.price', 0] }, 0] },
          commission_percentage: { $ifNull: [{ $arrayElemAt: ['$barber.commission_percentage', 0] }, 0] }
        }
      },
      {
        $project: {
          barber_id: 1,
          price: 1,
          stylist_commission: {
            $multiply: ['$price', { $divide: ['$commission_percentage', 100] }]
          }
        }
      },
      {
        $group: {
          _id: '$barber_id',
          completed_appointments_count: { $sum: 1 },
          gross_sales_generated: { $sum: '$price' },
          accumulated_commissions: { $sum: '$stylist_commission' }
        }
      },
      {
        $project: {
          barber_id: '$_id',
          completed_appointments_count: 1,
          gross_sales_generated: { $round: ['$gross_sales_generated', 2] },
          accumulated_commissions: { $round: ['$accumulated_commissions', 2] },
          salon_retained_earnings: { $round: [{ $subtract: ['$gross_sales_generated', '$accumulated_commissions'] }, 2] }
        }
      }
    ]);
  }

  /**
   * Total Shift Hours Clocked by Barber
   */
  async getAttendanceHoursAggregation() {
    return await Attendance.aggregate([
      {
        $match: {
          check_out: { $ne: null }
        }
      },
      {
        $project: {
          barber_id: 1,
          duration_hours: {
            $divide: [{ $subtract: ['$check_out', '$check_in'] }, 1000 * 60 * 60]
          }
        }
      },
      {
        $group: {
          _id: '$barber_id',
          total_hours_worked: { $sum: '$duration_hours' },
          total_shifts_count: { $sum: 1 }
        }
      },
      {
        $project: {
          barber_id: '$_id',
          total_hours_worked: { $round: ['$total_hours_worked', 2] },
          total_shifts_count: 1
        }
      }
    ]);
  }

  /**
   * All Barbers List
   */
  async getAllBarbers() {
    return await Barber.find().populate('user_id', 'name email role status');
  }

  /**
   * Customer Visits Aggregation
   */
  async getCustomerVisitsAggregation() {
    return await Appointment.aggregate([
      {
        $match: {
          status: 'Completed'
        }
      },
      {
        $lookup: {
          from: 'services',
          localField: 'service_id',
          foreignField: '_id',
          as: 'service'
        }
      },
      {
        $project: {
          customer_id: 1,
          price: { $ifNull: [{ $arrayElemAt: ['$service.price', 0] }, 0] },
          appointment_date: 1
        }
      },
      {
        $group: {
          _id: '$customer_id',
          visit_count: { $sum: 1 },
          total_spent: { $sum: '$price' },
          last_visit: { $max: '$appointment_date' },
          first_visit: { $min: '$appointment_date' }
        }
      },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $project: {
          customer_id: '$_id',
          visit_count: 1,
          total_spent: { $round: ['$total_spent', 2] },
          last_visit: 1,
          first_visit: 1,
          customer_name: { $arrayElemAt: ['$customer.name', 0] },
          customer_phone: { $arrayElemAt: ['$customer.phone', 0] },
          customer_email: { $arrayElemAt: ['$customer.email', 0] }
        }
      },
      { $sort: { visit_count: -1, total_spent: -1 } }
    ]);
  }

  /**
   * Total Customers Count
   */
  async getTotalCustomersCount() {
    return await Customer.countDocuments();
  }
}

module.exports = new ReportRepository();
