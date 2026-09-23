const express = require('express');
const router = express.Router();
const barberController = require('../controllers/barberController');
const validate = require('../middlewares/validate');
const { barberCreateSchema, barberUpdateSchema } = require('../validations/barberValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Listings are visible to all authenticated staff
router.get('/', protect, barberController.getAllBarbers);
router.get('/:id', protect, barberController.getBarberById);

// Editing staff profiling records is strictly Administrator-only
router.post('/', protect, authorize('Administrator'), validate(barberCreateSchema), barberController.createBarber);
router.put('/:id', protect, authorize('Administrator'), validate(barberUpdateSchema), barberController.updateBarber);
router.delete('/:id', protect, authorize('Administrator'), barberController.deleteBarber);

module.exports = router;
