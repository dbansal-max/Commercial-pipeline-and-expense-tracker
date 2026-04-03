const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateOwnProfile,
  updatePreferences,
  getMyActivity,
  deleteUser,
  changePassword,
  getAdminStats,
  updateUserStatus,
  getBasicUsersList
} = require('../controllers/userController');
const {
  authenticateToken,
  authorize,
  authorizeSelfOrAdmin
} = require('../middlewares/authenToken');

// Admin only routes
router.get('/', authenticateToken, authorize(['canManageUsers']), getAllUsers);
router.get('/stats', authenticateToken, authorize(['canManageUsers']), getAdminStats);

// Basic users list for dropdowns (accessible to authenticated users)
router.get('/basic', authenticateToken, getBasicUsersList);

// User accessible routes
router.get('/me/activity', authenticateToken, getMyActivity);
router.put('/profile/update', authenticateToken, updateOwnProfile);
router.put('/preferences', authenticateToken, updatePreferences);
router.put('/change-password', authenticateToken, changePassword);

// Self or admin routes
router.get('/profile/:id', authenticateToken, authorizeSelfOrAdmin, getUserById);

// Admin only routes with params
router.put('/:id', authenticateToken, authorize(['canManageUsers']), updateUser);
router.patch('/:id/status', authenticateToken, authorize(['canManageUsers']), updateUserStatus);
router.delete('/:id', authenticateToken, authorize(['canManageUsers']), deleteUser);
router.get('/:id', authenticateToken, authorize(['canManageUsers']), getUserById);

module.exports = router;
