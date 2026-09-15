'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roles', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
	type: Sequelize.ENUM('User', 'Analyst', 'Admin', 'Finance Manager', 'Employee', 'Viewer'),
        allowNull: false,
        unique: true
      },
      permissions: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: {
          canCreateRecords: false,
          canEditOwnRecords: false,
          canDeleteOwnRecords: false,
          canViewAllRecords: false,
          canEditAllRecords: false,
          canDeleteAllRecords: false,
          canManageUsers: false,
          canManageRoles: false,
          canApproveRequests: false
        }
      },
      is_deleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Add indexes
    try {
      await queryInterface.addIndex('roles', ['name'], { unique: true });
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Index "roles_name" already exists');
      } else {
        throw error;
      }
    }

    try {
      await queryInterface.addIndex('roles', ['is_deleted']);
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Index "roles_is_deleted" already exists');
      } else {
        throw error;
      }
    }

    // Insert default roles
    await queryInterface.bulkInsert('roles', [
      {
        name: 'User',
        permissions: JSON.stringify({
          canCreateRecords: true,
          canEditOwnRecords: true,
          canDeleteOwnRecords: false,
          canViewAllRecords: false,
          canEditAllRecords: false,
          canDeleteAllRecords: false,
          canManageUsers: false,
          canManageRoles: false,
          canApproveRequests: false
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Analyst',
        permissions: JSON.stringify({
          canCreateRecords: true,
          canEditOwnRecords: false,
          canDeleteOwnRecords: false,
          canViewAllRecords: true,
          canEditAllRecords: false,
          canDeleteAllRecords: false,
          canManageUsers: false,
          canManageRoles: false,
          canApproveRequests: false
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Admin',
        permissions: JSON.stringify({
          canCreateRecords: true,
          canEditOwnRecords: true,
          canDeleteOwnRecords: true,
          canViewAllRecords: true,
          canEditAllRecords: true,
          canDeleteAllRecords: true,
          canManageUsers: true,
          canManageRoles: true,
          canApproveRequests: true
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('roles');
  }
};
