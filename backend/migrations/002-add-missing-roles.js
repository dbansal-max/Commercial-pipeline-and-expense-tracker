'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add the new roles
    await queryInterface.bulkInsert('roles', [
      {
        name: 'Finance Manager',
        permissions: JSON.stringify({
          canCreateRecords: true,
          canEditOwnRecords: false,
          canDeleteOwnRecords: false,
          canViewAllRecords: true,
          canEditAllRecords: false,
          canDeleteAllRecords: false,
          canManageUsers: false,
          canManageRoles: false,
          canApproveRequests: true
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Employee',
        permissions: JSON.stringify({
          canCreateRecords: true,
          canEditOwnRecords: false,
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
        name: 'Viewer',
        permissions: JSON.stringify({
          canCreateRecords: true,
          canEditOwnRecords: false,
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
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('roles', {
      name: ['Finance Manager', 'Employee', 'Viewer']
    });
  }
};
