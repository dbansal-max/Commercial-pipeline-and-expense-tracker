module.exports = (sequelize, DataTypes) => {
  const EmailLog = sequelize.define('EmailLog', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    to_email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        isEmail: true,
        notEmpty: true
      }
    },
    subject: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [5, 255],
        notEmpty: true
      }
    },
    body: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    email_type: {
      type: DataTypes.ENUM(
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
      type: DataTypes.ENUM('Sent', 'Failed', 'Pending'),
      defaultValue: 'Sent'
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sent_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'email_logs',
    timestamps: false
  });

  return EmailLog;
};
