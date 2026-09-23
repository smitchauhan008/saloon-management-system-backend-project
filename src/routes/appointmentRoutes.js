const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const validate = require('../middlewares/validate');
const { 
  appointmentCreateSchema, 
  appointmentUpdateSchema,
  appointmentStatusUpdateSchema 
} = require('../validations/appointmentValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Section 4 RBAC: Appointment Lifecycle Administration
// Permitted roles: Administrator (Full Access), Receptionist (Full Access), Barber (No Access)
router.use(protect);
router.use(authorize('Administrator', 'Receptionist'));

// Module 5.5: Appointment Lifecycles Endpoints
router.get('/', appointmentController.getAllAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', validate(appointmentCreateSchema), appointmentController.createAppointment);
router.put('/:id', validate(appointmentUpdateSchema), appointmentController.updateAppointment);
router.patch('/:id/status', validate(appointmentStatusUpdateSchema), appointmentController.updateAppointmentStatus);
router.delete('/:id', appointmentController.deleteAppointment);

module.exports = router;
