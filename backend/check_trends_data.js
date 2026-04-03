const { sequelize, FinancialRecord } = require('./models');

async function checkTrendsData() {
  try {
    console.log('🔍 Checking trends data structure in database...');
    
    // Get current trends data structure
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
        [sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('MONTH FROM date')), 'ASC'],
        ['type', 'ASC']
      ]
    });
    
    console.log('🔍 Trends data structure check:');
    trends.forEach((item, index) => {
      const dataValues = item.dataValues;
      console.log('Period ' + (index + 1) + ': period=' + dataValues.period + ', income=' + dataValues.income + ', expense=' + dataValues.expense + ', netBalance=' + (dataValues.income - dataValues.expense) + ', recordCount=' + dataValues.recordCount);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Database check error:', error);
    process.exit(1);
  }
}

checkTrendsData();
