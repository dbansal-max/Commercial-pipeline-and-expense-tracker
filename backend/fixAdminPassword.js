const { sequelize } = require('./config/connection');
const { User } = require('./models');
const bcrypt = require('bcryptjs');

const fixAdminPassword = async () => {
  try {
    console.log('🔧 Fixing admin user password...');
    
    // Find the admin user
    const adminUser = await User.findOne({ where: { email: 'admin@finance.com' } });
    
    if (!adminUser) {
      console.error('❌ Admin user not found!');
      return;
    }
    
    // Hash password using the same method as User model
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update the password
    await adminUser.update({ password: hashedPassword });
    
    console.log('✅ Admin password fixed successfully!');
    
    // Test the new password
    const isValid = await adminUser.validatePassword('admin123');
    console.log('✅ Password validation test:', isValid ? 'PASSED' : 'FAILED');
    
    console.log('\n🔐 Login Credentials:');
    console.log('📧 Email: admin@finance.com');
    console.log('🔑 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    await sequelize.close();
  }
};

fixAdminPassword();
