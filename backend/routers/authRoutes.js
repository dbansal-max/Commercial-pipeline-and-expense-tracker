const express = require('express');
const router = express.Router();
const { register, adminRegister, login, getProfile, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticateToken, authorize } = require('../middlewares/authenToken');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Protected routes
router.post('/admin-register', authenticateToken, authorize(['canManageUsers']), adminRegister);
router.get('/profile', authenticateToken, getProfile);
router.post('/change-password', authenticateToken, changePassword);

module.exports = router;
