const { sequelize } = require('./config/connection');
const { Role, User } = require('./models');
const bcrypt = require('bcryptjs');

const createAdminUser = async () => {
  try {
    console.log('🔄 Creating default admin user...');
    
    // Get the Admin role
    const adminRole = await Role.findOne({ where: { name: 'Admin' } });
    
    if (!adminRole) {
      console.error('❌ Admin role not found!');
      return;
    }
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@finance.com' } });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('📧 Email: admin@finance.com');
      console.log('🔑 Password: admin123');
      return;
    }
    
    // Create admin user
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@finance.com',
      password: bcrypt.hashSync('admin123', 10),
      role_id: adminRole.id,
      status: 'Active',
      phone: '1234567890',
      address: 'System Admin Office'
    });
    
    console.log('✅ Default admin user created successfully!');
    console.log('📧 Email: admin@finance.com');
    console.log('🔑 Password: admin123');
    console.log('👤 User ID:', adminUser.id);
    console.log('🔐 Role:', adminRole.name);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await sequelize.close();
  }
};

createAdminUser();
