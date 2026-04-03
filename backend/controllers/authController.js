const { User, Role } = require('../models');
const { generateToken } = require('../services/setToken');
const { sendEmail } = require('../services/EmailServices');
const { getRegistrationEmailBody } = require('../services/EmailBody');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { getDefaultUserPreferences } = require('../config/defaults');

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // For public registration, only allow Viewer role
    if (role && role !== 'Viewer') {
      return res.status(403).json({
        success: false,
        message: 'Only Viewer accounts can be created publicly. Other roles require admin approval.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Get Viewer role for public registration
    const userRole = await Role.findOne({ where: { name: role || 'Viewer' } });
    if (!userRole) {
      return res.status(500).json({
        success: false,
        message: 'Viewer role not found'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role_id: userRole.id
    });

    // Generate token
    const token = generateToken({ userId: user.id });

    // Send welcome email
    try {
      const emailBody = getRegistrationEmailBody(user.name);
      await sendEmail(
        user.email,
        'Welcome to Finance Management System',
        emailBody,
        'Registration',
        user.id
      );
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: userRole.name,
          status: user.status
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

const adminRegister = async (req, res) => {
  try {
    const { name, email, password, roleName } = req.body;

    // Validate input
    if (!name || !email || !password || !roleName) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, and role are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Get specified role
    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role_id: role.id
    });

    // Send welcome email
    try {
      const emailBody = getRegistrationEmailBody(user.name);
      await sendEmail(
        user.email,
        'Welcome to Finance Management System',
        emailBody,
        'Registration',
        user.id
      );
    } catch (emailError) {
      console.error('Failed to send registration email:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully by admin',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: role.name,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user with role
    const user = await User.findOne({
      where: {
        email,
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
        message: 'Invalid credentials'
      });
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken({ userId: user.id });
    await user.update({ last_login_at: new Date() });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          permissions: user.role.permissions,
          status: user.status,
          phone: user.phone,
          address: user.address,
          bio: user.bio,
          preferences: user.preferences || getDefaultUserPreferences(),
          profile_img: user.profile_img,
          last_login_at: user.last_login_at
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'permissions']
      }],
      attributes: { exclude: ['password'] }
    });

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          permissions: user.role.permissions,
          status: user.status,
          phone: user.phone,
          address: user.address,
          bio: user.bio,
          preferences: user.preferences || getDefaultUserPreferences(),
          profile_img: user.profile_img,
          last_login_at: user.last_login_at
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    // Get user
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify current password
    const isValidPassword = await user.validatePassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const bcrypt = require('bcryptjs');
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await user.update({ password: hashedNewPassword });

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email, is_deleted: false } });

    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, password reset instructions have been sent.'
      });
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

    await user.update({
      reset_token: resetToken,
      reset_token_expiry: resetTokenExpiry
    });

    // Send reset email (you'll need to implement this email template)
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      const emailBody = `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
              <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
              <p style="color: #666;">Hi ${user.name},</p>
              <p style="color: #666;">You requested to reset your password for your Finance Management System account.</p>
              <p style="color: #666;">Click the link below to reset your password:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Reset Password
                </a>
              </div>
              <p style="color: #666;">This link will expire in 1 hour for security reasons.</p>
              <p style="color: #666;">If you didn't request this password reset, please ignore this email.</p>
              <p style="color: #666;">If the button above doesn't work, you can copy and paste this link into your browser:</p>
              <p style="color: #666; word-break: break-all; background-color: #f1f3f4; padding: 10px; border-radius: 5px;">${resetUrl}</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
              <p style="color: #999; font-size: 12px; text-align: center;">
                Finance Management System<br>
                This is an automated message, please do not reply.
              </p>
            </div>
          </body>
        </html>
      `;

      await sendEmail({
        to: user.email,
        subject: 'Password Reset - Finance Management System',
        html: emailBody
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Password reset instructions have been sent to your email address.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
      error: error.message
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({
      where: {
        reset_token: token,
        reset_token_expiry: { [Op.gt]: new Date() },
        is_deleted: false
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password and clear reset token
    await user.update({
      password: hashedPassword,
      reset_token: null,
      reset_token_expiry: null
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};

module.exports = {
  register,
  adminRegister,
  login,
  getProfile,
  changePassword,
  forgotPassword,
  resetPassword
};
