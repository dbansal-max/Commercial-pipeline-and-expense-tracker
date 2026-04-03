const { sequelize, FinancialRecord } = require('./models');
const moment = require('moment');

async function testTrendsDataStructure() {
  try {
    console.log('Testing trends data structure...');
    
    // Test the exact query used in the controller
    const trends = await FinancialRecord.findAll({
      where: {
        is_deleted: false,
        [sequelize.Sequelize.Op.and]: [
          sequelize.Sequelize.where(sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('YEAR FROM date')), '2026')
        ]
      },
      attributes: [
        [sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('MONTH FROM date')), 'period'],
        [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.literal('CASE WHEN type = \'Income\' THEN amount ELSE 0 END')), 'income'],
        [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.literal('CASE WHEN type = \'Expense\' THEN amount ELSE 0 END')), 'expense'],
        [sequelize.Sequelize.fn('COUNT', sequelize.Sequelize.col('id')), 'recordCount']
      ],
      group: [sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('MONTH FROM date'))],
      order: [
        [sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('MONTH FROM date')), 'ASC']
      ]
    });
    
    console.log('Raw trends query results:');
    trends.forEach((item, index) => {
      const dataValues = item.dataValues;
      console.log(`Period ${index + 1}:`, {
        period: dataValues.period,
        income: dataValues.income,
        expense: dataValues.expense,
        recordCount: dataValues.recordCount
      });
    });
    
    // Test the data processing logic
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
      formattedData[period].income += income;
      formattedData[period].expense += expense;
      formattedData[period].totalRecords += recordCount;
    });
    
    console.log('Processed formatted data:');
    Object.keys(formattedData).forEach(period => {
      const data = formattedData[period];
      console.log(`Period ${period}:`, {
        income: data.income,
        expense: data.expense,
        totalRecords: data.totalRecords
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Test trends data structure error:', error);
    process.exit(1);
  }
}

testTrendsDataStructure();
