const express = require('express');
const router = express.Router();
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { authenticateToken, authorize } = require('../middlewares/authenToken');

router.get('/', authenticateToken, authorize(['canManageSettings']), getSettings);
router.put('/', authenticateToken, authorize(['canManageSettings']), updateSettings);

module.exports = router;
