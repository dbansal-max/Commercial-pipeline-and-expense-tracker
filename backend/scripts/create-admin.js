require('dotenv').config();
const bcrypt = require('bcryptjs');
const { User, Role } = require('../models');
const { sequelize } = require('../config/connection');

const createAdmin = async () => {
  try {
    console.log('🔄 Creating admin user...');
    
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@finance.com' },
      include: [{ model: Role, as: 'role' }]
    });
    
    if (existingAdmin) {
      console.log('ℹ️ Admin user already exists:', existingAdmin.email);
      console.log('🔑 Admin role:', existingAdmin.role.name);
      process.exit(0);
    }
    
    // Get Admin role
    const adminRole = await Role.findOne({ where: { name: 'Admin' } });
    if (!adminRole) {
      throw new Error('Admin role not found. Please run migrations first.');
    }
    
    // Create admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@finance.com',
      password: 'admin123456', // Default password - should be changed
      role_id: adminRole.id,
      status: 'Active'
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@finance.com');
    console.log('🔑 Password: admin123456');
    console.log('⚠️  Please change the default password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  createAdmin();
}

module.exports = { createAdmin };
