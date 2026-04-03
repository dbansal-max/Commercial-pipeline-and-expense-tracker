const { sequelize } = require('./config/connection');
const { User, Role } = require('./models');
const bcrypt = require('bcryptjs');

const checkAdminUser = async () => {
  try {
    console.log('🔍 Checking admin user...');
    
    // Find the admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@finance.com' },
      include: [{ model: Role, as: 'role' }]
    });
    
    if (!adminUser) {
      console.error('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('📧 Email:', adminUser.email);
    console.log('👤 Name:', adminUser.name);
    console.log('🆔 ID:', adminUser.id);
    console.log('🔐 Role:', adminUser.role?.name);
    console.log('📊 Status:', adminUser.status);
    console.log('🗑️ Is Deleted:', adminUser.is_deleted);
    
    // Test password validation
    console.log('\n🔑 Testing password validation...');
    const isValid = await adminUser.validatePassword('admin123');
    console.log('✅ Password "admin123" valid:', isValid);
    
    // Test with wrong password
    const isInvalid = await adminUser.validatePassword('wrongpassword');
    console.log('❌ Password "wrongpassword" valid:', isInvalid);
    
    // Show password hash (for debugging)
    console.log('\n🔐 Password hash:', adminUser.password);
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  } finally {
    await sequelize.close();
  }
};

checkAdminUser();
