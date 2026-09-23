const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');
const validate = require('../middlewares/validate');
const { serviceCreateSchema, serviceUpdateSchema } = require('../validations/serviceValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

// Reading the service menu catalog can be open to all authorized roles
router.get('/', protect, serviceController.getAllServices);
router.get('/:id', protect, serviceController.getServiceById);

// Service adjustments (Write, Edit, Delete) are strictly Administrator-only
router.post('/', protect, authorize('Administrator'), validate(serviceCreateSchema), serviceController.createService);
router.put('/:id', protect, authorize('Administrator'), validate(serviceUpdateSchema), serviceController.updateService);
router.delete('/:id', protect, authorize('Administrator'), serviceController.deleteService);

module.exports = router;
