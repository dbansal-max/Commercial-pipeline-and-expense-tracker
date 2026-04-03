module.exports = (sequelize, DataTypes) => {
  const EditDeleteRequest = sequelize.define('EditDeleteRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    record_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'financial_records',
        key: 'id'
      }
    },
    type: {
      type: DataTypes.ENUM('Edit', 'Delete'),
      allowNull: false
    },
    requested_changes: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object containing the changes requested for edit operations'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [5, 500],
        notEmpty: true
      }
    },
    status: {
      type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'),
      defaultValue: 'Pending'
    },
    admin_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin who processed the request'
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notes from admin about the decision'
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
    tableName: 'edit_delete_requests',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  return EditDeleteRequest;
};
