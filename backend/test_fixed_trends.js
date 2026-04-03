const { sequelize, FinancialRecord } = require('./models');
const moment = require('moment');

async function testFixedTrends() {
  try {
    console.log('Testing fixed trends query...');
    
    // Test the new trends query structure
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
    
    console.log('Fixed trends query result:');
    trends.forEach((item, index) => {
      console.log(`Period ${index + 1}:`, {
        period: item.dataValues.period,
        income: item.dataValues.income,
        expense: item.dataValues.expense,
        recordCount: item.dataValues.recordCount
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Test fixed trends error:', error);
    process.exit(1);
  }
}

testFixedTrends();
