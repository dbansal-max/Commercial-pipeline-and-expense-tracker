const { sequelize } = require('./config/connection');
const bcrypt = require('bcryptjs');

const fixAdminPasswordDirect = async () => {
  try {
    console.log('🔧 Fixing admin password directly in database...');
    
    // Hash password with the same method as User model
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    
    // Update password directly in database (bypassing hooks)
    await sequelize.query(`
      UPDATE users 
      SET password = :password, updated_at = CURRENT_TIMESTAMP 
      WHERE email = 'admin@finance.com'
    `, {
      replacements: { password: hashedPassword },
      type: sequelize.QueryTypes.UPDATE
    });
    
    console.log('✅ Admin password updated directly!');
    
    // Test by fetching and validating
    const { User } = require('./models');
    const adminUser = await User.findOne({ where: { email: 'admin@finance.com' } });
    const isValid = await adminUser.validatePassword('admin123');
    
    console.log('✅ Password validation test:', isValid ? 'PASSED' : 'FAILED');
    
    if (isValid) {
      console.log('\n🎉 SUCCESS! Admin user is ready for login:');
      console.log('📧 Email: admin@finance.com');
      console.log('🔑 Password: admin123');
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    await sequelize.close();
  }
};

fixAdminPasswordDirect();
