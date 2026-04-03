const os = require('os');
const { FinancialRecord, User, EditDeleteRequest, AppSetting, sequelize } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

const canViewAllDashboardData = (roleName) =>
  ['Admin', 'Finance Manager', 'Analyst'].includes(roleName);

const applyRecordScope = (whereClause, reqUser, requestedUserId) => {
  // Regular users (Employee, User, Viewer) can only see their own data
  if (!canViewAllDashboardData(reqUser.role.name)) {
    whereClause.user_id = reqUser.id;
    return whereClause;
  }

  // Elevated roles (Admin, Analyst, Finance Manager) can see all data
  // But can also filter by specific user if requested
  if (requestedUserId) {
    whereClause.user_id = requestedUserId;
  }

  return whereClause;
};

const getMonthlySummary = async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const targetMonth = month || moment().format('MM');
    const targetYear = year || moment().format('YYYY');

    let whereClause = {
      is_deleted: false,
      [Op.and]: [
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), targetMonth),
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM date')), targetYear)
      ]
    };

    applyRecordScope(whereClause, req.user, userId);

    const summary = await FinancialRecord.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalRecords'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.literal('CASE WHEN type = \'Income\' THEN amount ELSE 0 END'), 'decimal')), 'totalIncome'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.literal('CASE WHEN type = \'Expense\' THEN amount ELSE 0 END'), 'decimal')), 'totalExpense'],
        [sequelize.literal('(SUM(CASE WHEN type = \'Income\' THEN amount ELSE 0 END) - SUM(CASE WHEN type = \'Expense\' THEN amount ELSE 0 END))'), 'netBalance']
      ]
    });

    const result = summary[0];
    const data = {
      month: targetMonth,
      year: targetYear,
      totalRecords: parseInt(result.dataValues.totalRecords) || 0,
      totalIncome: parseFloat(result.dataValues.totalIncome) || 0,
      totalExpense: parseFloat(result.dataValues.totalExpense) || 0,
      netBalance: parseFloat(result.dataValues.netBalance) || 0
    };

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get monthly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly summary',
      error: error.message
    });
  }
};

const getYearlySummary = async (req, res) => {
  try {
    const { year, userId } = req.query;
    const targetYear = year || moment().format('YYYY');

    let whereClause = {
      is_deleted: false,
      [Op.and]: [
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM date')), targetYear)
      ]
    };

    applyRecordScope(whereClause, req.user, userId);

    const summary = await FinancialRecord.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalRecords'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.literal('CASE WHEN type = \'Income\' THEN amount ELSE 0 END'), 'decimal')), 'totalIncome'],
        [sequelize.fn('SUM', sequelize.cast(sequelize.literal('CASE WHEN type = \'Expense\' THEN amount ELSE 0 END'), 'decimal')), 'totalExpense'],
        [sequelize.literal('(SUM(CASE WHEN type = \'Income\' THEN amount ELSE 0 END) - SUM(CASE WHEN type = \'Expense\' THEN amount ELSE 0 END))'), 'netBalance']
      ]
    });

    const result = summary[0];
    const data = {
      year: targetYear,
      totalRecords: parseInt(result.dataValues.totalRecords) || 0,
      totalIncome: parseFloat(result.dataValues.totalIncome) || 0,
      totalExpense: parseFloat(result.dataValues.totalExpense) || 0,
      netBalance: parseFloat(result.dataValues.netBalance) || 0
    };

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Get yearly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yearly summary',
      error: error.message
    });
  }
};

const getCategoryWiseSummary = async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const targetMonth = month || moment().format('MM');
    const targetYear = year || moment().format('YYYY');

    let whereClause = {
      is_deleted: false,
      [Op.and]: [
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), targetMonth),
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM date')), targetYear)
      ]
    };

    applyRecordScope(whereClause, req.user, userId);

    const categorySummary = await FinancialRecord.findAll({
      where: whereClause,
      attributes: [
        'category',
        'type',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category', 'type'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
    });

    // Calculate overspending analysis
    const incomeCategories = categorySummary.filter(item => item.type === 'Income');
    const expenseCategories = categorySummary.filter(item => item.type === 'Expense');

    const totalIncome = incomeCategories.reduce((sum, item) => sum + parseFloat(item.dataValues.totalAmount), 0);
    const totalExpense = expenseCategories.reduce((sum, item) => sum + parseFloat(item.dataValues.totalAmount), 0);

    const overspendingCategories = expenseCategories.map(category => {
      const categoryAmount = parseFloat(category.dataValues.totalAmount);
      const percentage = totalIncome > 0 ? (categoryAmount / totalIncome) * 100 : 0;
      return {
        category: category.category,
        amount: categoryAmount,
        percentage: percentage.toFixed(2),
        isOverspending: percentage > 30 // Consider overspending if category > 30% of total income
      };
    });

    res.status(200).json({
      success: true,
      data: {
        incomeCategories: incomeCategories.map(item => ({
          category: item.category,
          amount: parseFloat(item.dataValues.totalAmount),
          count: parseInt(item.dataValues.count)
        })),
        expenseCategories: expenseCategories.map(item => ({
          category: item.category,
          amount: parseFloat(item.dataValues.totalAmount),
          count: parseInt(item.dataValues.count)
        })),
        overspendingAnalysis: overspendingCategories,
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense
      }
    });
  } catch (error) {
    console.error('Get category-wise summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category-wise summary',
      error: error.message
    });
  }
};

const getTrends = async (req, res) => {
  try {
    const { period = 'monthly', year, userId } = req.query;
    const targetYear = year || moment().format('YYYY');

    let whereClause = {
      is_deleted: false,
      [Op.and]: [
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM date')), targetYear)
      ]
    };

    applyRecordScope(whereClause, req.user, userId);

    let groupBy, dateFormat, periodFormat;
    if (period === 'monthly') {
      groupBy = [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), 'type'];
      dateFormat = 'MONTH';
      periodFormat = 'MM';
    } else if (period === 'weekly') {
      groupBy = [sequelize.fn('EXTRACT', sequelize.literal('WEEK FROM date')), 'type'];
      dateFormat = 'WEEK';
      periodFormat = 'WW';
    } else if (period === 'quarterly') {
      groupBy = [sequelize.fn('EXTRACT', sequelize.literal('QUARTER FROM date')), 'type'];
      dateFormat = 'QUARTER';
      periodFormat = 'Q';
    } else {
      groupBy = [sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), 'type'];
      dateFormat = 'MONTH';
      periodFormat = 'MM';
    }

    // Get main trends data
    const trends = await FinancialRecord.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal(`${dateFormat} FROM date`)), 'period'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN type = \'Income\' THEN amount ELSE 0 END')), 'income'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN type = \'Expense\' THEN amount ELSE 0 END')), 'expense'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'recordCount']
      ],
      group: [sequelize.fn('EXTRACT', sequelize.literal(`${dateFormat} FROM date`))],
      order: [
        [sequelize.fn('EXTRACT', sequelize.literal(`${dateFormat} FROM date`)), 'ASC']
      ]
    });

    // Get category-wise trends for more detailed analysis
    const categoryTrends = await FinancialRecord.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('EXTRACT', sequelize.literal(`${dateFormat} FROM date`)), 'period'],
        'category',
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN type = \'Income\' THEN amount ELSE 0 END')), 'income'],
        [sequelize.fn('SUM', sequelize.literal('CASE WHEN type = \'Expense\' THEN amount ELSE 0 END')), 'expense']
      ],
      group: [
        sequelize.fn('EXTRACT', sequelize.literal(`${dateFormat} FROM date`)),
        'category'
      ],
      order: [
        [sequelize.fn('EXTRACT', sequelize.literal(`${dateFormat} FROM date`)), 'ASC'],
        ['category', 'ASC']
      ]
    });

    // Get user-wise trends if user has elevated permissions
    let userTrends = [];
    if (canViewAllDashboardData(req.user.role.name)) {
      const aggregatedTrends = await FinancialRecord.findAll({
        where: whereClause,
        attributes: [
          [sequelize.fn('EXTRACT', sequelize.literal(`${dateFormat} FROM date`)), 'period'],
          'user_id',
          [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'recordCount']
        ],
        group: [sequelize.fn('EXTRACT', sequelize.literal(`${dateFormat} FROM date`)), 'user_id'],
        order: [
          [sequelize.fn('EXTRACT', sequelize.literal(`${dateFormat} FROM date`)), 'ASC'],
          ['user_id', 'ASC']
        ],
        subQuery: false,
        raw: true
      });

      // Get user details
      const userIds = [...new Set(aggregatedTrends.map(t => t.user_id))];
      const users = await User.findAll({
        where: { id: userIds },
        attributes: ['id', 'name', 'email'],
        raw: true
      });
      const userMap = Object.fromEntries(users.map(u => [u.id, u]));

      // Combine trend data with user details
      userTrends = aggregatedTrends.map(trend => ({
        ...trend,
        user: userMap[trend.user_id] || { name: 'Unknown', email: '' }
      }));
    }

    // Format data for charts
    const formattedData = {};
    trends.forEach(item => {
      const period = item.dataValues.period;
      const income = parseFloat(item.dataValues.income) || 0;
      const expense = parseFloat(item.dataValues.expense) || 0;
      const recordCount = parseInt(item.dataValues.recordCount) || 0;

      if (!formattedData[period]) {
        formattedData[period] = {
          period,
          income: 0,
          expense: 0,
          totalRecords: 0
        };
      }

      // Accumulate data for this period
      formattedData[period].income += income;
      formattedData[period].expense += expense;
      formattedData[period].totalRecords += recordCount;
    });

    // Calculate net balance and savings rate for each period
    Object.keys(formattedData).forEach(period => {
      const data = formattedData[period];
      data.netBalance = data.income - data.expense;
      data.savingsRate = data.income > 0 ? ((data.netBalance / data.income) * 100) : 0;

      // Calculate additional savings metrics
      data.totalSavings = data.netBalance > 0 ? data.netBalance : 0;
      data.totalDeficit = data.netBalance < 0 ? Math.abs(data.netBalance) : 0;
      data.savingsEfficiency = data.income > 0 ? ((data.totalSavings / data.income) * 100) : 0;

      // Calculate savings goals (20% of income as target)
      data.savingsGoal = data.income * 0.20;
      data.savingsGoalAchieved = data.totalSavings >= data.savingsGoal;
      data.savingsGoalProgress = data.savingsGoal > 0 ? (data.totalSavings / data.savingsGoal) * 100 : 0;

      // Format period for display
      if (periodFormat === 'MM') {
        data.periodLabel = moment(`${targetYear}-${period.padStart(2, '0')}-01`).format('MMM YYYY');
      } else if (periodFormat === 'WW') {
        data.periodLabel = `Week ${period} - ${targetYear}`;
      } else if (periodFormat === 'Q') {
        data.periodLabel = `Q${period} - ${targetYear}`;
      } else {
        data.periodLabel = moment(`${targetYear}-${period.padStart(2, '0')}-01`).format('MMM YYYY');
      }
    });

    const chartData = Object.values(formattedData);

    // Format category trends
    const formattedCategoryData = {};
    categoryTrends.forEach(item => {
      const periodValue = item.dataValues.period;
      const category = item.category;
      const income = parseFloat(item.dataValues.income) || 0;
      const expense = parseFloat(item.dataValues.expense) || 0;

      if (!formattedCategoryData[periodValue]) {
        formattedCategoryData[periodValue] = { period: periodValue };
      }
      if (!formattedCategoryData[periodValue][category]) {
        formattedCategoryData[periodValue][category] = {};
      }
      formattedCategoryData[periodValue][category].income = income;
      formattedCategoryData[periodValue][category].expense = expense;
    });

    const categoryChartData = Object.values(formattedCategoryData);

    // Calculate trend insights
    const insights = [];
    if (chartData.length > 1) {
      const firstPeriod = chartData[0];
      const lastPeriod = chartData[chartData.length - 1];

      const incomeGrowth = firstPeriod.income > 0 ? ((lastPeriod.income - firstPeriod.income) / firstPeriod.income * 100) : 0;
      const expenseGrowth = firstPeriod.expense > 0 ? ((lastPeriod.expense - firstPeriod.expense) / firstPeriod.expense * 100) : 0;

      insights.push({
        type: 'income',
        value: incomeGrowth,
        description: `Income ${incomeGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(incomeGrowth).toFixed(1)}%`
      });
      insights.push({
        type: 'expense',
        value: expenseGrowth,
        description: `Expenses ${expenseGrowth >= 0 ? 'increased' : 'decreased'} by ${Math.abs(expenseGrowth).toFixed(1)}%`
      });
    }

    res.json({
      success: true,
      data: {
        trends: chartData,
        categoryTrends: categoryChartData,
        userTrends: userTrends.map(item => ({
          period: item.period,
          userId: item.user_id,
          userName: item.user?.name || 'Unknown',
          userEmail: item.user?.email || '',
          totalAmount: parseFloat(item.totalAmount),
          recordCount: parseInt(item.recordCount)
        })),
        insights,
        summary: {
          totalIncome: chartData.reduce((sum, item) => sum + item.income, 0),
          totalExpenses: chartData.reduce((sum, item) => sum + item.expense, 0),
          totalNetBalance: chartData.reduce((sum, item) => sum + item.netBalance, 0),
          totalSavings: chartData.reduce((sum, item) => sum + (item.totalSavings || 0), 0),
          totalDeficit: chartData.reduce((sum, item) => sum + (item.totalDeficit || 0), 0),
          averageSavingsRate: chartData.length > 0 ? (chartData.reduce((sum, item) => sum + item.savingsRate, 0) / chartData.length).toFixed(2) : 0,
          averageSavingsEfficiency: chartData.length > 0 ? (chartData.reduce((sum, item) => sum + (item.savingsEfficiency || 0), 0) / chartData.length).toFixed(2) : 0,
          totalSavingsGoal: chartData.reduce((sum, item) => sum + (item.savingsGoal || 0), 0),
          totalSavingsGoalProgress: chartData.length > 0 ? (chartData.reduce((sum, item) => sum + (item.savingsGoalProgress || 0), 0) / chartData.length).toFixed(2) : 0,
          savingsGoalsAchieved: chartData.filter(item => item.savingsGoalAchieved).length,
          totalRecords: chartData.reduce((sum, item) => sum + item.totalRecords, 0)
        },
        period: periodFormat === 'MM' ? 'monthly' : periodFormat === 'Q' ? 'quarterly' : periodFormat === 'WW' ? 'weekly' : 'yearly',
        year: targetYear
      }
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trends',
      error: error.message
    });
  }
};

const getReductionPlan = async (req, res) => {
  try {
    const { month, year, userId } = req.query;
    const targetMonth = month || moment().format('MM');
    const targetYear = year || moment().format('YYYY');

    let whereClause = {
      is_deleted: false,
      type: 'Expense',
      [Op.and]: [
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), targetMonth),
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM date')), targetYear)
      ]
    };

    applyRecordScope(whereClause, req.user, userId);

    const expenses = await FinancialRecord.findAll({
      where: whereClause,
      attributes: [
        'category',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category'],
      order: [[sequelize.fn('SUM', sequelize.col('amount')), 'DESC']]
    });

    // Calculate total income for comparison
    let incomeWhereClause = {
      is_deleted: false,
      type: 'Income',
      [Op.and]: [
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM date')), targetMonth),
        sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM date')), targetYear)
      ]
    };

    applyRecordScope(incomeWhereClause, req.user, userId);

    const incomeResult = await FinancialRecord.findAll({
      where: incomeWhereClause,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalIncome']
      ]
    });

    const totalIncome = parseFloat(incomeResult[0]?.dataValues.totalIncome) || 0;

    // Generate reduction suggestions
    const reductionPlan = expenses.map(expense => {
      const amount = parseFloat(expense.dataValues.totalAmount);
      const percentage = totalIncome > 0 ? (amount / totalIncome) * 100 : 0;

      let suggestion = '';
      let reductionPotential = 0;

      if (percentage > 30) {
        suggestion = 'High priority: This category is consuming more than 30% of your income';
        reductionPotential = amount * 0.3; // 30% reduction potential
      } else if (percentage > 20) {
        suggestion = 'Medium priority: Consider reducing expenses in this category';
        reductionPotential = amount * 0.2; // 20% reduction potential
      } else if (percentage > 10) {
        suggestion = 'Low priority: Monitor this category for potential savings';
        reductionPotential = amount * 0.1; // 10% reduction potential
      } else {
        suggestion = 'This category is within reasonable limits';
        reductionPotential = amount * 0.05; // 5% reduction potential
      }

      return {
        category: expense.category,
        currentAmount: amount,
        percentage: percentage.toFixed(2),
        suggestion,
        reductionPotential: reductionPotential.toFixed(2),
        targetAmount: (amount - reductionPotential).toFixed(2)
      };
    });

    const totalPotentialSavings = reductionPlan.reduce((sum, item) =>
      sum + parseFloat(item.reductionPotential), 0);

    res.status(200).json({
      success: true,
      data: {
        reductionPlan,
        totalIncome,
        totalPotentialSavings,
        month: targetMonth,
        year: targetYear
      }
    });
  } catch (error) {
    console.error('Get reduction plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate reduction plan',
      error: error.message
    });
  }
};

const getSystemHealth = async (req, res) => {
  const requestStartedAt = Date.now();

  try {
    const todayStart = moment().startOf('day').toDate();
    const weekStart = moment().startOf('week').toDate();
    const [dbPingResult] = await sequelize.query('SELECT 1 AS ok');
    const dbPingMs = Date.now() - requestStartedAt;

    const [
      totalUsers,
      activeUsers,
      activeToday,
      newUsersThisWeek,
      totalRecords,
      pendingRequests,
      latestRecord,
      settingsRecord
    ] = await Promise.all([
      User.count({ where: { is_deleted: false } }),
      User.count({ where: { is_deleted: false, status: 'Active' } }),
      User.count({
        where: {
          is_deleted: false,
          last_login_at: {
            [Op.gte]: todayStart
          }
        }
      }),
      User.count({
        where: {
          is_deleted: false,
          created_at: {
            [Op.gte]: weekStart
          }
        }
      }),
      FinancialRecord.count({ where: { is_deleted: false } }),
      EditDeleteRequest.count({
        where: {
          is_deleted: false,
          status: 'Pending'
        }
      }),
      FinancialRecord.findOne({
        where: { is_deleted: false },
        attributes: ['updated_at'],
        order: [['updated_at', 'DESC']]
      }),
      AppSetting.findOne({ where: { key: 'global' } })
    ]);

    const memoryUsage = process.memoryUsage();
    const heapUsagePercent = memoryUsage.heapTotal > 0
      ? Number(((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(1))
      : 0;
    const settings = settingsRecord?.settings || {};

    res.status(200).json({
      success: true,
      data: {
        database: {
          connected: Array.isArray(dbPingResult),
          totalRecords,
          pendingRequests,
          databasePingMs: dbPingMs,
          lastDataUpdateAt: latestRecord?.updated_at || null,
          lastBackupAt: settings.backup?.lastBackupAt || null,
          backupFrequency: settings.backup?.backupFrequency || 'Not configured'
        },
        users: {
          totalUsers,
          activeUsers,
          activeToday,
          newUsersThisWeek
        },
        performance: {
          apiStatus: 'Operational',
          responseTimeMs: Date.now() - requestStartedAt,
          uptimeSeconds: Math.floor(process.uptime()),
          memoryUsageMb: Number((memoryUsage.rss / (1024 * 1024)).toFixed(1)),
          heapUsagePercent,
          loadAverage: os.loadavg().map((value) => Number(value.toFixed(2)))
        }
      }
    });
  } catch (error) {
    console.error('Get system health error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
      error: error.message
    });
  }
};

const getUserAnalysis = async (req, res) => {
  try {
    const { period = 'monthly', sortBy = 'name', sortOrder = 'asc', userId } = req.query;
    const targetMonth = moment().format('MM');
    const targetYear = moment().format('YYYY');

    // Determine date range based on period
    let startDate, endDate;
    const now = moment();

    switch (period) {
      case 'daily':
        startDate = now.startOf('day').toDate();
        endDate = now.endOf('day').toDate();
        break;
      case 'weekly':
        startDate = now.startOf('week').toDate();
        endDate = now.endOf('week').toDate();
        break;
      case 'monthly':
        startDate = now.startOf('month').toDate();
        endDate = now.endOf('month').toDate();
        break;
      case 'quarterly':
        startDate = now.startOf('quarter').toDate();
        endDate = now.endOf('quarter').toDate();
        break;
      case 'yearly':
        startDate = now.startOf('year').toDate();
        endDate = now.endOf('year').toDate();
        break;
      default:
        startDate = now.startOf('month').toDate();
        endDate = now.endOf('month').toDate();
    }

    // Only users with elevated roles can access user analysis
    if (!canViewAllDashboardData(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access user analysis'
      });
    }

    // Get all users with their financial records for the period
    const usersWithRecords = await User.findAll({
      where: { is_deleted: false },
      attributes: ['id', 'name', 'email', 'status', 'created_at'],
      include: [
        {
          model: FinancialRecord,
          as: 'financialRecords',
          where: {
            is_deleted: false,
            date: {
              [Op.between]: [startDate, endDate]
            }
          },
          attributes: ['id', 'type', 'amount', 'category', 'date'],
          required: false // Include users even if they have no records
        }
      ],
      order: [
        [sequelize.literal(`LOWER(${sortBy})`), sortOrder.toUpperCase()]
      ]
    });

    // Process data for analysis
    const userAnalysisData = usersWithRecords.map(user => {
      const records = user.financialRecords || [];
      const income = records
        .filter(r => r.type === 'Income')
        .reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const expenses = records
        .filter(r => r.type === 'Expense')
        .reduce((sum, r) => sum + parseFloat(r.amount), 0);
      const netBalance = income - expenses;
      const savingsRate = income > 0 ? ((netBalance / income) * 100) : 0;

      // Get top expense category
      const expenseByCategory = {};
      records
        .filter(r => r.type === 'Expense')
        .forEach(r => {
          expenseByCategory[r.category] = (expenseByCategory[r.category] || 0) + parseFloat(r.amount);
        });
      const topExpenseCategory = Object.entries(expenseByCategory)
        .sort(([, a], [, b]) => b - a)[0] || ['N/A', 0];

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role?.name || 'User',
        status: user.status,
        records: records.map(r => ({
          id: r.id,
          type: r.type.toLowerCase(),
          amount: parseFloat(r.amount),
          category: r.category,
          date: r.date
        })),
        income,
        expenses,
        netBalance,
        savingsRate: parseFloat(savingsRate.toFixed(2)),
        topExpenseCategory: topExpenseCategory[0],
        topExpenseAmount: topExpenseCategory[1],
        totalRecords: records.length
      };
    });

    // Filter by specific user if requested
    let filteredData = userAnalysisData;
    if (userId) {
      filteredData = userAnalysisData.filter(user => user.id === userId);
    }

    // Apply sorting
    filteredData.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'income':
          aValue = a.income;
          bValue = b.income;
          break;
        case 'expenses':
          aValue = a.expenses;
          bValue = b.expenses;
          break;
        case 'netBalance':
          aValue = a.netBalance;
          bValue = b.netBalance;
          break;
        case 'savingsRate':
          aValue = a.savingsRate;
          bValue = b.savingsRate;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        users: filteredData,
        period,
        totalUsers: filteredData.length,
        summary: {
          totalIncome: filteredData.reduce((sum, user) => sum + user.income, 0),
          totalExpenses: filteredData.reduce((sum, user) => sum + user.expenses, 0),
          averageSavingsRate: filteredData.length > 0
            ? (filteredData.reduce((sum, user) => sum + user.savingsRate, 0) / filteredData.length).toFixed(2)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get user analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user analysis',
      error: error.message
    });
  }
};

const getUsersForReports = async (req, res) => {
  try {
    // Only users with elevated roles can access user list for reports
    if (!canViewAllDashboardData(req.user.role.name)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access user list'
      });
    }

    const { search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;

    // Build search condition
    const searchCondition = search ? {
      [Op.or]: [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ]
    } : {};

    // Get users with their roles
    const users = await User.findAll({
      where: {
        is_deleted: false,
        status: 'Active',
        ...searchCondition
      },
      attributes: ['id', 'name', 'email', 'status', 'created_at'],
      include: [
        {
          model: require('../models').Role,
          as: 'role',
          attributes: ['id', 'name']
        }
      ],
      order: [
        [sequelize.literal(`LOWER("User"."${sortBy}")`), sortOrder.toUpperCase()]
      ],
      subQuery: false
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role?.name || 'User',
      status: user.status,
      createdAt: user.created_at
    }));

    res.status(200).json({
      success: true,
      data: formattedUsers
    });
  } catch (error) {
    console.error('Get users for reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

module.exports = {
  getMonthlySummary,
  getYearlySummary,
  getCategoryWiseSummary,
  getTrends,
  getReductionPlan,
  getSystemHealth,
  getUserAnalysis,
  getUsersForReports
};
