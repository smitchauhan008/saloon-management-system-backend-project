const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const validate = require('../middlewares/validate');
const { slotBlockCreateSchema } = require('../validations/slotValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Section 4 RBAC: Time Schedule/Daily Grid Allocation
// Permitted roles: Administrator (Full Access), Receptionist (Full Access), Barber (No Access)
router.use(protect);
router.use(authorize('Administrator', 'Receptionist'));

// Module 5.6: Advanced Time Slot Scheduling Engine Routes
router.get('/', slotController.getSlots);
router.post('/', validate(slotBlockCreateSchema), slotController.createSlotBlock);
router.get('/exceptions', slotController.getExceptions);
router.delete('/exceptions/:id', slotController.deleteException);

module.exports = router;
