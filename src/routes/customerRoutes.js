const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const validate = require('../middlewares/validate');
const { customerCreateSchema, customerUpdateSchema } = require('../validations/customerValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

// GET routes are accessible by Administrator and Receptionist
router.get('/', protect, authorize('Administrator', 'Receptionist'), customerController.getCustomers);
router.get('/:id', protect, authorize('Administrator', 'Receptionist'), customerController.getCustomerById);

// Write routes are accessible by Administrator and Receptionist
router.post('/', protect, authorize('Administrator', 'Receptionist'), validate(customerCreateSchema), customerController.createCustomer);
router.put('/:id', protect, authorize('Administrator', 'Receptionist'), validate(customerUpdateSchema), customerController.updateCustomer);
router.delete('/:id', protect, authorize('Administrator', 'Receptionist'), customerController.deleteCustomer);

module.exports = router;
