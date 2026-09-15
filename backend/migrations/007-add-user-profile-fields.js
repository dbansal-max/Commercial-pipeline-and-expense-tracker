'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING(30),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'address', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'preferences', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: {
        emailNotifications: true,
        smsNotifications: false,
        dashboardTheme: 'light',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        language: 'en'
      }
    });

    await queryInterface.addColumn('users', 'last_login_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Ensure existing users have the application's default preferences.
    await queryInterface.sequelize.query(`
      UPDATE "users"
      SET "preferences" = '{"emailNotifications":true,"smsNotifications":false,"dashboardTheme":"light","currency":"INR","dateFormat":"DD/MM/YYYY","language":"en"}'::json
      WHERE "preferences" IS NULL;
    `);

    // Make preferences mandatory, matching models/User.js.
    await queryInterface.changeColumn('users', 'preferences', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: {
        emailNotifications: true,
        smsNotifications: false,
        dashboardTheme: 'light',
        currency: 'INR',
        dateFormat: 'DD/MM/YYYY',
        language: 'en'
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('users', 'last_login_at');
    await queryInterface.removeColumn('users', 'preferences');
    await queryInterface.removeColumn('users', 'bio');
    await queryInterface.removeColumn('users', 'address');
    await queryInterface.removeColumn('users', 'phone');
  }
};
