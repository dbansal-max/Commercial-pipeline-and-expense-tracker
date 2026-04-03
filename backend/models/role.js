const { getDefaultPermissions } = require('../config/defaults');

module.exports = (sequelize, DataTypes) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.ENUM('User', 'Analyst', 'Admin', 'Finance Manager', 'Employee', 'Viewer'),
      allowNull: false,
      unique: true
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: getDefaultPermissions()
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  // Set default permissions based on role name
  Role.beforeCreate(async (role) => {
    role.permissions = getDefaultPermissions(role.name);
  });

  return Role;
};
