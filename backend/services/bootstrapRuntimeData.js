const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/connection');
const { AppSetting, Role } = require('../models');
const {
  getDefaultAppSettings,
  getDefaultPermissions,
  getDefaultUserPreferences
} = require('../config/defaults');

const ensureUserColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const columns = await queryInterface.describeTable('users');

  const missingColumns = [
    {
      name: 'phone',
      definition: {
        type: DataTypes.STRING(30),
        allowNull: true
      }
    },
    {
      name: 'address',
      definition: {
        type: DataTypes.STRING(255),
        allowNull: true
      }
    },
    {
      name: 'bio',
      definition: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    },
    {
      name: 'preferences',
      definition: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: getDefaultUserPreferences()
      }
    },
    {
      name: 'last_login_at',
      definition: {
        type: DataTypes.DATE,
        allowNull: true
      }
    }
  ];

  for (const column of missingColumns) {
    if (!columns[column.name]) {
      await queryInterface.addColumn('users', column.name, column.definition);
    }
  }
};

const ensureRolePermissions = async () => {
  const roles = await Role.findAll();

  for (const role of roles) {
    const nextPermissions = {
      ...getDefaultPermissions(),
      ...(role.permissions || {})
    };

    // Ensure Analyst has proper permissions
    if (role.name === 'Analyst') {
      nextPermissions.canViewAllRecords = true;
      nextPermissions.canCreateRecords = false; // Analyst cannot create records
      nextPermissions.canEditOwnRecords = false; // Analyst cannot edit records
      nextPermissions.canDeleteOwnRecords = false; // Analyst cannot delete records
    }

    // Ensure Employee has proper permissions
    if (role.name === 'Employee') {
      nextPermissions.canViewAllRecords = true; // Employee can view all records
    }

    if (role.name === 'Admin' && !nextPermissions.canManageSettings) {
      nextPermissions.canManageSettings = true;
    }

    if (role.name !== 'Admin' && typeof nextPermissions.canManageSettings !== 'boolean') {
      nextPermissions.canManageSettings = false;
    }

    if (JSON.stringify(nextPermissions) !== JSON.stringify(role.permissions || {})) {
      await role.update({ permissions: nextPermissions });
    }
  }
};

const ensureAppSettings = async () => {
  await AppSetting.sync();

  const [settings] = await AppSetting.findOrCreate({
    where: { key: 'global' },
    defaults: {
      settings: getDefaultAppSettings()
    }
  });

  if (!settings.settings) {
    await settings.update({ settings: getDefaultAppSettings() });
  }
};

const bootstrapRuntimeData = async () => {
  await ensureUserColumns();
  await ensureRolePermissions();
  await ensureAppSettings();
};

module.exports = {
  bootstrapRuntimeData
};
