const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { registerSchema, loginSchema } = require('../validations/authValidation');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/users/staff', protect, authorize('Administrator'), validate(registerSchema), authController.register);
router.get('/users/staff', protect, authorize('Administrator'), authController.getStaff);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.put('/change-password', protect, authController.changePassword);

module.exports = router;
