const { sequelize, FinancialRecord } = require('./models');

async function checkData() {
  try {
    console.log('Checking total records...');
    const totalRecords = await FinancialRecord.count({ where: { is_deleted: false } });
    console.log('Total records:', totalRecords);
    
    console.log('Checking records with amount...');
    const recordsWithAmount = await FinancialRecord.findAll({
      where: { 
        is_deleted: false,
        amount: { [sequelize.Op.ne]: null }
      },
      limit: 5,
      attributes: ['id', 'amount', 'type', 'date', 'user_id']
    });
    console.log('Sample records:', recordsWithAmount.map(r => ({
      id: r.id,
      amount: r.amount,
      type: r.type,
      date: r.date,
      user_id: r.user_id
    })));
    
    console.log('Checking distinct types...');
    const types = await FinancialRecord.findAll({
      where: { is_deleted: false },
      attributes: [[sequelize.fn('DISTINCT', sequelize.col('type')), 'type']]
    });
    console.log('Available types:', types.map(t => t.type));
    
    process.exit(0);
  } catch (error) {
    console.error('Database check error:', error);
    process.exit(1);
  }
}

checkData();
