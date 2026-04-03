const { User, Role, FinancialRecord, EditDeleteRequest, EmailLog, sequelize } = require('../models');
const { Op, literal, fn, col } = require('sequelize');
const { sendEmail } = require('../services/EmailServices');
const { getAccountStatusChangeEmailBody } = require('../services/EmailBody');
const { getDefaultUserPreferences } = require('../config/defaults');

const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', role = '' } = req.query;
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const parsedLimit = Math.max(parseInt(limit, 10) || 10, 1);
    const offset = (parsedPage - 1) * parsedLimit;

    const whereClause = {
      is_deleted: false
    };

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const roleInclude = {
      model: Role,
      as: 'role',
      attributes: ['id', 'name']
    };

    if (role) {
      roleInclude.where = { name: role };
      roleInclude.required = true;
    }

    const { count, rows: users } = await User.findAndCountAll({
      where: whereClause,
      include: [roleInclude],
      attributes: { exclude: ['password'] },
      limit: parsedLimit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total: count,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.max(Math.ceil(count / parsedLimit), 1)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findOne({
      where: {
        id,
        is_deleted: false
      },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'permissions']
      }],
      attributes: { exclude: ['password'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's financial records summary
    const recordSummary = await FinancialRecord.findAll({
      where: {
        user_id: id,
        is_deleted: false
      },
      attributes: [
        [fn('COUNT', col('id')), 'totalRecords'],
        [fn('SUM', literal("CASE WHEN type = 'Income' THEN amount ELSE 0 END")), 'totalIncome'],
        [fn('SUM', literal("CASE WHEN type = 'Expense' THEN amount ELSE 0 END")), 'totalExpense']
      ]
    });

    const summary = recordSummary[0]?.dataValues || {};

    res.status(200).json({
      success: true,
      data: {
        user,
        summary: {
          totalRecords: parseInt(summary.totalRecords, 10) || 0,
          totalIncome: parseFloat(summary.totalIncome) || 0,
          totalExpense: parseFloat(summary.totalExpense) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, status, roleId, profileImg } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Email already registered'
        });
      }
    }

    if (status && !['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const previousStatus = user.status;

    // Update user
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (status) updateData.status = status;
    if (roleId) updateData.role_id = roleId;
    if (profileImg) updateData.profile_img = profileImg;

    await user.update(updateData);

    // Send email if status changed
    if (status && status !== previousStatus) {
      try {
        const emailBody = getAccountStatusChangeEmailBody(user.name, status);
        await sendEmail(
          user.email,
          'Account Status Updated',
          emailBody,
          'AccountStatusChange',
          user.id
        );
      } catch (emailError) {
        console.error('Failed to send status change email:', emailError);
      }
    }

    // Get updated user with role
    const updatedUser = await User.findByPk(id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'permissions']
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

const updateOwnProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, phone, address, bio, profileImg } = req.body;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update user
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (bio !== undefined) updateData.bio = bio;
    if (profileImg !== undefined) updateData.profile_img = profileImg;

    await user.update(updateData);

    // Get updated user with role
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
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update own profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.id === parseInt(id, 10)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete user
    await user.update({ is_deleted: true });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Validate current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    await user.update({ password: newPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

const updatePreferences = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: 'Preferences payload must be an object'
      });
    }

    const nextPreferences = {
      ...getDefaultUserPreferences(),
      ...(user.preferences || {}),
      ...req.body
    };

    await user.update({ preferences: nextPreferences });

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: nextPreferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: error.message
    });
  }
};

const getMyActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const [user, records, requests, emails] = await Promise.all([
      User.findByPk(userId, {
        attributes: ['id', 'created_at', 'updated_at', 'last_login_at']
      }),
      FinancialRecord.findAll({
        where: { user_id: userId, is_deleted: false },
        attributes: ['id', 'type', 'category', 'amount', 'created_at', 'updated_at'],
        order: [['updated_at', 'DESC']],
        limit: 4
      }),
      EditDeleteRequest.findAll({
        where: { user_id: userId, is_deleted: false },
        attributes: ['id', 'type', 'status', 'reason', 'created_at', 'updated_at'],
        include: [{
          model: FinancialRecord,
          as: 'record',
          attributes: ['category']
        }],
        order: [['updated_at', 'DESC']],
        limit: 4
      }),
      EmailLog.findAll({
        where: { user_id: userId },
        attributes: ['id', 'subject', 'status', 'sent_at'],
        order: [['sent_at', 'DESC']],
        limit: 3
      })
    ]);

    const activities = [];

    if (user?.last_login_at) {
      activities.push({
        id: `login-${user.id}`,
        type: 'login',
        title: 'Signed in successfully',
        description: 'Your last authenticated session was recorded by the backend.',
        timestamp: user.last_login_at
      });
    }

    if (user?.updated_at && user?.created_at && new Date(user.updated_at).getTime() !== new Date(user.created_at).getTime()) {
      activities.push({
        id: `profile-${user.id}`,
        type: 'profile',
        title: 'Profile or preferences updated',
        description: 'Your account details or saved preferences were changed.',
        timestamp: user.updated_at
      });
    }

    records.forEach((record) => {
      activities.push({
        id: `record-${record.id}`,
        type: 'record',
        title: `${record.type} record saved`,
        description: `${record.category} entry for ${parseFloat(record.amount).toFixed(2)} was saved in your account.`,
        timestamp: record.updated_at || record.created_at
      });
    });

    requests.forEach((request) => {
      activities.push({
        id: `request-${request.id}`,
        type: 'request',
        title: `${request.type} request ${request.status.toLowerCase()}`,
        description: `${request.record?.category || 'Record'} request: ${request.reason}`,
        timestamp: request.updated_at || request.created_at
      });
    });

    emails.forEach((email) => {
      activities.push({
        id: `email-${email.id}`,
        type: 'email',
        title: 'System email logged',
        description: `${email.subject} (${email.status})`,
        timestamp: email.sent_at
      });
    });

    activities.sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp));

    res.status(200).json({
      success: true,
      data: activities.slice(0, 8)
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.count({ where: { is_deleted: false } });
    const activeUsers = await User.count({ where: { status: 'Active', is_deleted: false } });
    const inactiveUsers = await User.count({ where: { status: 'Inactive', is_deleted: false } });
    const totalRecords = await FinancialRecord.count({ where: { is_deleted: false } });

    // Calculate total income and expenses
    const financialStats = await FinancialRecord.findAll({
      where: { is_deleted: false },
      attributes: [
        [fn('SUM', literal('CASE WHEN type = \'Income\' THEN amount ELSE 0 END')), 'totalIncome'],
        [fn('SUM', literal('CASE WHEN type = \'Expense\' THEN amount ELSE 0 END')), 'totalExpense']
      ]
    });

    const stats = financialStats[0]?.dataValues || { totalIncome: 0, totalExpense: 0 };

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        totalRecords,
        totalIncome: parseFloat(stats.totalIncome) || 0,
        totalExpense: parseFloat(stats.totalExpense) || 0
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
      error: error.message
    });
  }
};

const getBasicUsersList = async (req, res) => {
  try {
    console.log('🔍 getBasicUsersList called');

    // Simple query without complex includes to avoid 500 error
    const users = await User.findAll({
      where: {
        status: 'Active',
        is_deleted: false
      },
      attributes: ['id', 'name', 'email'], // Only basic fields
      limit: 50,
      order: [['name', 'ASC']]
    });

    console.log('✅ Users fetched successfully:', users.length);

    res.status(200).json({
      success: true,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('❌ Get basic users list error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    if (req.user.id === parseInt(id, 10) && status === 'Inactive') {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.is_deleted) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ status });

    // Send email notification
    try {
      const emailBody = getAccountStatusChangeEmailBody(user.name, status);
      await sendEmail(
        user.email,
        `Account Status ${status}`,
        emailBody,
        'AccountStatusChange',
        user.id
      );
    } catch (emailError) {
      console.error('Failed to send status change email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
        role_id: user.role_id
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
};

module.exports = {
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
};
