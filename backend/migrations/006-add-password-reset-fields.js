'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add reset_token and reset_token_expiry columns to users table
    await queryInterface.addColumn('users', 'reset_token', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'reset_token_expiry', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the columns if rolling back
    await queryInterface.removeColumn('users', 'reset_token');
    await queryInterface.removeColumn('users', 'reset_token_expiry');
  }
};
