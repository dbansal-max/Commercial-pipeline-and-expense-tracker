const { sequelize } = require('../config/connection');
const { DataTypes } = require('sequelize');

const Role = require('./role')(sequelize, DataTypes);
const User = require('./user')(sequelize, DataTypes);
const FinancialRecord = require('./financialRecord')(sequelize, DataTypes);
const EditDeleteRequest = require('./editDeleteRequest')(sequelize, DataTypes);
const EmailLog = require('./emailLog')(sequelize, DataTypes);
const AppSetting = require('./appSetting')(sequelize, DataTypes);

// Define associations
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

User.hasMany(FinancialRecord, { foreignKey: 'user_id', as: 'financialRecords' });
FinancialRecord.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(EditDeleteRequest, { foreignKey: 'user_id', as: 'editDeleteRequests' });
EditDeleteRequest.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

FinancialRecord.hasMany(EditDeleteRequest, { foreignKey: 'record_id', as: 'editDeleteRequests' });
EditDeleteRequest.belongsTo(FinancialRecord, { foreignKey: 'record_id', as: 'record' });

User.hasMany(EmailLog, { foreignKey: 'user_id', as: 'emailLogs' });
EmailLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(AppSetting, { foreignKey: 'updated_by', as: 'updatedSettings' });
AppSetting.belongsTo(User, { foreignKey: 'updated_by', as: 'updatedBy' });

const db = {
  sequelize,
  Role,
  User,
  FinancialRecord,
  EditDeleteRequest,
  EmailLog,
  AppSetting
};

module.exports = db;
