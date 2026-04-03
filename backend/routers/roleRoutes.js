const express = require('express');
const router = express.Router();
const { 
  getAllRoles, 
  getRoleById, 
  createRole, 
  updateRole, 
  deleteRole, 
  assignRole 
} = require('../controllers/roleController');
const { 
  authenticateToken, 
  authorize 
} = require('../middlewares/authenToken');

// All role routes require admin permissions
router.get('/', authenticateToken, authorize(['canManageRoles']), getAllRoles);
router.get('/:id', authenticateToken, authorize(['canManageRoles']), getRoleById);
router.post('/', authenticateToken, authorize(['canManageRoles']), createRole);
router.put('/:id', authenticateToken, authorize(['canManageRoles']), updateRole);
router.delete('/:id', authenticateToken, authorize(['canManageRoles']), deleteRole);
router.post('/assign', authenticateToken, authorize(['canManageUsers']), assignRole);

module.exports = router;
