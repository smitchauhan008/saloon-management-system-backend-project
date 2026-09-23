const express = require('express');
const router = express.Router();
const wageController = require('../controllers/wageController');
const validate = require('../middlewares/validate');
const { 
  wageCalculationQuerySchema, 
  wageFinalizeSchema, 
  wageQuerySchema 
} = require('../validations/wageValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Section 4 RBAC: Wages & Payroll Processing Modules
// Administrator: Full Access
// Barber: View Personal
// Receptionist: No Access
router.use(protect);

// 1. High-Level Executive Payroll Summary (Admin only)
router.get('/summary', authorize('Administrator'), wageController.getSummary);

// 2. Live Payroll & Commission Calculations (Admin & Barber)
// Barber is scoped to personal statement; Admin can calculate for specific barber or all
router.get('/calculate', authorize('Administrator', 'Barber'), validate(wageCalculationQuerySchema, 'query'), wageController.calculatePayroll);

// 3. Finalize Monthly Wage Payouts (Admin only)
router.post('/', authorize('Administrator'), validate(wageFinalizeSchema), wageController.finalizePayroll);

// 4. Barber Personal Wage Records (Barber only)
router.get('/my-wages', authorize('Barber'), wageController.getMyWages);

// 5. Query Historical Wage Records (Admin only)
router.get('/', authorize('Administrator'), validate(wageQuerySchema, 'query'), wageController.getAllWages);

// 6. Single Wage Record by ID (Admin, or Barber for own record)
router.get('/:id', authorize('Administrator', 'Barber'), wageController.getWageById);

module.exports = router;
