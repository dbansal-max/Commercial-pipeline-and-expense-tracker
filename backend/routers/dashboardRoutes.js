const express = require('express');
const router = express.Router();
const {
  getMonthlySummary,
  getYearlySummary,
  getCategoryWiseSummary,
  getTrends,
  getReductionPlan,
  getSystemHealth,
  getUserAnalysis,
  getUsersForReports
} = require('../controllers/dashboardController');
const {
  authenticateToken,
  authorize
} = require('../middlewares/authenToken');

// Dashboard visibility is handled inside the controllers based on role scope
router.get('/monthly', authenticateToken, getMonthlySummary);
router.get('/yearly', authenticateToken, getYearlySummary);
router.get('/category-wise', authenticateToken, getCategoryWiseSummary);
router.get('/trends', authenticateToken, getTrends);
router.get('/reduction-plan', authenticateToken, getReductionPlan);
router.get('/system-health', authenticateToken, authorize(['canManageUsers']), getSystemHealth);
router.get('/user-analysis', authenticateToken, getUserAnalysis);
router.get('/users-for-reports', authenticateToken, getUsersForReports);

module.exports = router;
