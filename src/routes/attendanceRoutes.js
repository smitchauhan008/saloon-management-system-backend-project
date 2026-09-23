const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const validate = require('../middlewares/validate');
const { checkInSchema, checkOutSchema } = require('../validations/attendanceValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Section 4 RBAC: Attendance Review & Registration
// Administrator: Full Access
// Barber: Mark Personal Only
// Receptionist: No Access
router.use(protect);
router.use(authorize('Administrator', 'Barber'));

// Module 5.7: Employee Attendance Trackers Endpoints
router.post('/checkin', validate(checkInSchema), attendanceController.checkIn);
router.post('/checkout', validate(checkOutSchema), attendanceController.checkOut);
router.get('/', attendanceController.getAttendance);
router.get('/summary', attendanceController.getSummary);

module.exports = router;
