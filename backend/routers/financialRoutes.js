const express = require('express');
const router = express.Router();
const {
  createRecord,
  getAllRecords,
  getRecordById,
  updateRecord,
  deleteRecord
} = require('../controllers/financialController');
const {
  authenticateToken,
  authorize
} = require('../middlewares/authenToken');

// Create record - Users can create their own, Admins can create for anyone
router.post('/', authenticateToken, authorize(['canCreateRecords']), createRecord);

// Get all records - Role-based scope is enforced inside the controller
router.get('/', authenticateToken, getAllRecords);

// Get specific record - Role-based scope is enforced inside the controller
router.get('/:id', authenticateToken, getRecordById);

// Update record - Admin edits directly, other creators submit approval requests
router.put('/:id', authenticateToken, authorize(['canCreateRecords']), updateRecord);

// Delete record - Admin deletes directly, other creators submit approval requests
router.delete('/:id', authenticateToken, authorize(['canCreateRecords']), deleteRecord);

module.exports = router;
