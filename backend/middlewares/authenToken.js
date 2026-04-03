const { verifyToken } = require('../services/setToken');
const { User, Role } = require('../models');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = verifyToken(token);
    
    // Get user with role
    const user = await User.findOne({
      where: { 
        id: decoded.userId,
        status: 'Active',
        is_deleted: false
      },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'permissions']
      }]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: error.message
    });
  }
};

const authorize = (permissions) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: No role assigned'
      });
    }

    const userPermissions = req.user.role.permissions;
    
    // Check if user has all required permissions
    const hasPermission = permissions.every(permission => 
      userPermissions[permission] === true
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Insufficient permissions'
      });
    }

    next();
  };
};

const authorizeSelfOrAdmin = (req, res, next) => {
  const targetUserId = parseInt(req.params.id || req.params.userId);
  const currentUserId = req.user.id;
  const userRole = req.user.role.name;

  // Users can only access their own data, Admins can access all data
  if (userRole === 'Admin' || currentUserId === targetUserId) {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied: You can only access your own data'
    });
  }
};

module.exports = {
  authenticateToken,
  authorize,
  authorizeSelfOrAdmin
};
