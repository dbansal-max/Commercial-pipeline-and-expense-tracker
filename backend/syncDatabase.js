const { sequelize } = require('./config/connection');
const { Role, User, FinancialRecord, EditDeleteRequest, EmailLog } = require('./models');
const { getDefaultPermissions } = require('./config/defaults');

const syncDatabase = async () => {
  try {
    console.log('🔄 Starting database synchronization...');

    // Force sync to drop and recreate tables
    await sequelize.sync({ force: true });

    console.log('✅ Database synchronized successfully!');

    // Create default roles
    console.log('📝 Creating default roles...');

    const defaultRoles = [
      {
        name: 'Admin',
        permissions: getDefaultPermissions('Admin')
      },
      {
        name: 'Finance Manager',
        permissions: getDefaultPermissions('Finance Manager')
      },
      {
        name: 'Analyst',
        permissions: getDefaultPermissions('Analyst')
      },
      {
        name: 'Employee',
        permissions: getDefaultPermissions('Employee')
      },
      {
        name: 'Viewer',
        permissions: getDefaultPermissions('Viewer')
      }
    ];

    await Role.bulkCreate(defaultRoles);
    console.log('✅ Default roles created successfully!');

    console.log('🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
  } finally {
    await sequelize.close();
  }
};

syncDatabase();
