const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const validate = require('../middlewares/validate');
const { 
  dailyReportQuerySchema, 
  monthlyReportQuerySchema, 
  topServicesQuerySchema, 
  customerVisitsQuerySchema 
} = require('../validations/reportValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Section 4 RBAC: Corporate Financial Dashboard Analytics
// Administrator: Full Access
// Receptionist: No Access
// Barber: No Access
router.use(protect);
router.use(authorize('Administrator'));

// Module 5.9: Corporate Dashboard Reporting Endpoints
router.get('/daily-revenue', validate(dailyReportQuerySchema, 'query'), reportController.getDailyRevenue);
router.get('/monthly-revenue', validate(monthlyReportQuerySchema, 'query'), reportController.getMonthlyRevenue);
router.get('/top-services', validate(topServicesQuerySchema, 'query'), reportController.getTopServices);
router.get('/barber-performance', reportController.getBarberPerformance);
router.get('/customer-visits', validate(customerVisitsQuerySchema, 'query'), reportController.getCustomerVisits);

module.exports = router;
