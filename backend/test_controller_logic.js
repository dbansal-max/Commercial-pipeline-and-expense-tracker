const { sequelize, FinancialRecord } = require('./models');

async function testControllerLogic() {
  try {
    console.log('🔍 Testing controller logic...');
    
    // Simulate the exact controller query
    const whereClause = {
      is_deleted: false,
      [sequelize.Sequelize.Op.and]: [
        sequelize.Sequelize.where(sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('YEAR FROM date')), '2026')
      ]
    };
    
    const dateFormat = 'MONTH';
    
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
    
    console.log('🔍 Raw query results:');
    trends.forEach((item, index) => {
      const dataValues = item.dataValues;
      console.log('Period ' + (index + 1) + ': period=' + dataValues.period + ', income=' + dataValues.income + ', expense=' + dataValues.expense + ', recordCount=' + dataValues.recordCount);
    });
    
    // Test the data processing logic from controller
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
    
    console.log('🔍 Processed formatted data:');
    Object.keys(formattedData).forEach(period => {
      const data = formattedData[period];
      const netBalance = data.income - data.expense;
      const savingsRate = data.income > 0 ? ((netBalance / data.income) * 100) : 0;
      console.log('Period ' + period + ': income=' + data.income + ', expense=' + data.expense + ', netBalance=' + netBalance + ', savingsRate=' + savingsRate.toFixed(2) + '%');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Test controller logic error:', error);
    process.exit(1);
  }
}

testControllerLogic();
