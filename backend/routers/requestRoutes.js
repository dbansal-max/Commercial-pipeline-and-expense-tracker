const express = require('express');
const router = express.Router();
const { 
  createEditRequest, 
  createDeleteRequest, 
  getPendingRequests, 
  getUserRequests, 
  approveRequest, 
  rejectRequest 
} = require('../controllers/requestController');
const { 
  authenticateToken, 
  authorize 
} = require('../middlewares/authenToken');

// Create requests - Users can create for their own records
router.post('/edit', authenticateToken, authorize(['canCreateRecords']), createEditRequest);
router.post('/delete', authenticateToken, authorize(['canCreateRecords']), createDeleteRequest);

// View requests
router.get('/pending', authenticateToken, authorize(['canApproveRequests']), getPendingRequests);
router.get('/my-requests', authenticateToken, authorize(['canCreateRecords']), getUserRequests);

// Process requests - Admin only
router.put('/:id/approve', authenticateToken, authorize(['canApproveRequests']), approveRequest);
router.put('/:id/reject', authenticateToken, authorize(['canApproveRequests']), rejectRequest);

module.exports = router;
