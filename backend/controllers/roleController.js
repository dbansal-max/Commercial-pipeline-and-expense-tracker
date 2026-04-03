const { Role, User } = require('../models');
const { getAllowedPermissions } = require('../config/defaults');

const getAllRoles = async (req, res) => {
  try {
    // Simple query without complex subqueries for now
    const roles = await Role.findAll({
      where: { is_deleted: false },
      order: [['name', 'ASC']]
    });

    res.status(200).json({
      success: true,
      data: roles
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findOne({
      where: {
        id,
        is_deleted: false
      },
      include: [{
        model: User,
        as: 'users',
        attributes: ['id', 'name', 'email', 'status'],
        required: false
      }]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { role }
    });
  } catch (error) {
    console.error('Get role by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role',
      error: error.message
    });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, permissions } = req.body;

    // Validate input
    if (!name || !permissions) {
      return res.status(400).json({
        success: false,
        message: 'Role name and permissions are required'
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(409).json({
        success: false,
        message: 'Role already exists'
      });
    }

    // Validate permissions structure
    const requiredPermissions = getAllowedPermissions();

    const invalidPermissions = Object.keys(permissions).filter(
      key => !requiredPermissions.includes(key)
    );

    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid permissions: ${invalidPermissions.join(', ')}`
      });
    }

    // Create role
    const role = await Role.create({
      name,
      permissions
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: { role }
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error.message
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent editing default roles
    if (['User', 'Analyst', 'Admin'].includes(role.name)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit default roles (User, Analyst, Admin)'
      });
    }

    // Check if name is being changed and if it's already taken
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ where: { name } });
      if (existingRole) {
        return res.status(409).json({
          success: false,
          message: 'Role name already exists'
        });
      }
    }

    // Validate permissions structure if provided
    if (permissions) {
      const requiredPermissions = getAllowedPermissions();

      const invalidPermissions = Object.keys(permissions).filter(
        key => !requiredPermissions.includes(key)
      );

      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid permissions: ${invalidPermissions.join(', ')}`
        });
      }
    }

    // Update role
    const updateData = {};
    if (name) updateData.name = name;
    if (permissions) updateData.permissions = permissions;

    await role.update(updateData);

    // Get updated role
    const updatedRole = await Role.findByPk(id);

    res.status(200).json({
      success: true,
      message: 'Role updated successfully',
      data: { role: updatedRole }
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error.message
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Prevent deleting default roles
    if (['User', 'Analyst', 'Admin'].includes(role.name)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete default roles (User, Analyst, Admin)'
      });
    }

    // Check if role is being used by any users
    const usersWithRole = await User.count({
      where: {
        role_id: id,
        is_deleted: false
      }
    });

    if (usersWithRole > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role`
      });
    }

    // Soft delete role
    await role.update({ is_deleted: true });

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error.message
    });
  }
};

const assignRole = async (req, res) => {
  try {
    const { userId, roleId } = req.body;

    // Validate input
    if (!userId || !roleId) {
      return res.status(400).json({
        success: false,
        message: 'User ID and Role ID are required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const role = await Role.findByPk(roleId);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Update user role
    await user.update({ role_id: roleId });

    // Get updated user with new role
    const updatedUser = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'permissions']
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      message: 'Role assigned successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign role',
      error: error.message
    });
  }
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignRole
};
