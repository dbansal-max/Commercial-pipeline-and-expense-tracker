module.exports = (sequelize, DataTypes) => {
  const FinancialRecord = sequelize.define('FinancialRecord', {
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
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
        notEmpty: true
      }
    },
    type: {
      type: DataTypes.ENUM('Income', 'Expense'),
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        len: [2, 50],
        notEmpty: true,
        isIn: [['Salary', 'Freelance', 'Investment', 'Business', 'Rent Income', 'Interest', 'Dividends', 'Bonus', 'Commission', 'Other Income', 'Food & Dining', 'Transport', 'Housing', 'Utilities', 'Healthcare', 'Entertainment', 'Shopping', 'Education', 'Insurance', 'Taxes', 'Savings', 'Groceries', 'Fuel', 'Internet', 'Phone Bill', 'EMI', 'Loan Payment', 'Travel', 'Gifts', 'Other Expenses']]
      }
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        notEmpty: true
      }
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'financial_records',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  return FinancialRecord;
};
