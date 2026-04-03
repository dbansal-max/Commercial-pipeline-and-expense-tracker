require('dotenv').config();
const { Sequelize } = require('sequelize');

// Connect to PostgreSQL default database (postgres) to create our database
const setupDatabase = async () => {
  try {
    console.log('🔄 Setting up database...');

    // First connect to default postgres database
    const sequelize = new Sequelize(
      'postgres', // default database
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || '3112',
      {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: console.log
      }
    );

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL');

    // Create the database
    try {
      await sequelize.query(`CREATE DATABASE ${process.env.DB_NAME || 'finance_management'}`);
      console.log(`✅ Database '${process.env.DB_NAME || 'finance_management'}' created successfully`);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log(`✅ Database '${process.env.DB_NAME || 'finance_management'}' already exists`);
      } else {
        throw error;
      }
    }

    // Close connection
    await sequelize.close();

    console.log('🎉 Database setup completed!');
    console.log('📋 Next steps:');
    console.log('1. Run: node scripts/run-migrations.js');
    console.log('2. Run: node scripts/create-admin.js');
    console.log('3. Start the backend: npm start');

    process.exit(0);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);

    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Troubleshooting tips:');
      console.log('1. Make sure PostgreSQL is running');
      console.log('2. Check your PostgreSQL password in .env file');
      console.log('3. Verify PostgreSQL user exists and has correct permissions');
      console.log('4. Try connecting with: psql -U postgres -h localhost');
    }

    process.exit(1);
  }
};

if (require.main === module) {
  setupDatabase();
}

module.exports = { setupDatabase };
