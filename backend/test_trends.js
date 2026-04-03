const { sequelize, FinancialRecord } = require('./models');
const moment = require('moment');

async function testTrends() {
  try {
    console.log('Testing trends query...');
    
    // Test basic trends query
    const trends = await FinancialRecord.findAll({
      where: {
        is_deleted: false,
        [sequelize.Sequelize.Op.and]: [
          sequelize.Sequelize.where(sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('YEAR FROM date')), '2026')
        ]
      },
      attributes: [
        [sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('MONTH FROM date')), 'period'],
        'type',
        [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('amount')), 'totalAmount']
      ],
      group: [
        [sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('MONTH FROM date')), 'type']
      ],
      order: [
        [sequelize.Sequelize.fn('EXTRACT', sequelize.Sequelize.literal('MONTH FROM date')), 'ASC'],
        ['type', 'ASC']
      ]
    });
    
    console.log('Trends query result:');
    console.log(JSON.stringify(trends, null, 2));
    
    // Test simplified query
    const simpleQuery = await FinancialRecord.findAll({
      where: { is_deleted: false },
      attributes: ['type', [sequelize.Sequelize.fn('SUM', sequelize.Sequelize.col('amount')), 'total']],
      group: ['type']
    });
    
    console.log('Simple query result:');
    console.log(JSON.stringify(simpleQuery, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Test trends error:', error);
    process.exit(1);
  }
}

testTrends();
