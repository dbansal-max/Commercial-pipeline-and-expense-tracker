'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('email_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      to_email: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      subject: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      email_type: {
        type: Sequelize.ENUM(
          'Registration',
          'PasswordReset',
          'EditRequestSubmitted',
          'EditRequestApproved',
          'EditRequestRejected',
          'DeleteRequestSubmitted',
          'DeleteRequestApproved',
          'DeleteRequestRejected',
          'AccountStatusChange',
          'Other'
        ),
        defaultValue: 'Other'
      },
      status: {
        type: Sequelize.ENUM('Sent', 'Failed', 'Pending'),
        defaultValue: 'Sent'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      sent_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('email_logs', ['user_id']);
    await queryInterface.addIndex('email_logs', ['to_email']);
    await queryInterface.addIndex('email_logs', ['email_type']);
    await queryInterface.addIndex('email_logs', ['status']);
    await queryInterface.addIndex('email_logs', ['sent_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('email_logs');
  }
};
