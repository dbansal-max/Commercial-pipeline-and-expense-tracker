require('dotenv').config();
const { sequelize } = require('../config/connection');

// Import migration files in order
const migrations = [
  require('../migrations/001-create-roles'),
  require('../migrations/002-create-users'),
  require('../migrations/003-create-financial-records'),
  require('../migrations/004-create-edit-delete-requests'),
  require('../migrations/005-create-email-logs')
];

const runMigrations = async () => {
  try {
    console.log('🔄 Starting database migrations...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection established');
    
    // Run migrations in order
    for (const migration of migrations) {
      console.log(`⬆️ Running migration: ${migration.constructor.name}`);
      await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
      console.log(`✅ Migration completed: ${migration.constructor.name}`);
    }
    
    console.log('🎉 All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
