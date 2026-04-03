require('dotenv').config();
const moment = require('moment');
const { Op } = require('sequelize');
const {
  sequelize,
  Role,
  User,
  FinancialRecord,
  EditDeleteRequest,
  EmailLog,
  AppSetting
} = require('../models');
const { getDefaultPermissions, getDefaultAppSettings, getDefaultUserPreferences } = require('../config/defaults');

const DEMO_PASSWORD = 'Demo@123';

const ROLE_PERMISSIONS = {
  Admin: getDefaultPermissions('Admin'),
  'Finance Manager': getDefaultPermissions('Finance Manager'),
  Analyst: getDefaultPermissions('Analyst'),
  Employee: getDefaultPermissions('Employee'),
  User: getDefaultPermissions('User'),
  Viewer: getDefaultPermissions('Viewer')
};

const DEMO_USERS = [
  { name: 'Aarav Mehta', email: 'admin@finance.com', roleName: 'Admin', status: 'Active' },
  { name: 'Priya Sharma', email: 'manager@finance.demo', roleName: 'Finance Manager', status: 'Active' },
  { name: 'Rohan Kapoor', email: 'analyst@finance.demo', roleName: 'Analyst', status: 'Active' },
  { name: 'Neha Verma', email: 'employee@finance.demo', roleName: 'Employee', status: 'Active' },
  { name: 'Karan Singh', email: 'user@finance.demo', roleName: 'User', status: 'Active' },
  { name: 'Ishita Rao', email: 'viewer@finance.demo', roleName: 'Viewer', status: 'Active' },
  { name: 'Meera Joshi', email: 'team.lead@finance.demo', roleName: 'Finance Manager', status: 'Active' },
  { name: 'Aditya Nair', email: 'ops.employee@finance.demo', roleName: 'Employee', status: 'Active' }
];

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);

const makeAmount = (base, monthIndex, userIndex, variance = 0) => {
  const offset = ((monthIndex + 1) * (userIndex + 2) * 137) % (variance + 1 || 1);
  return Number((base + offset).toFixed(2));
};

const monthLabel = (date) => moment(date).format('MMMM YYYY');

const buildIncomePlan = (roleName, monthIndex, userIndex) => {
  const plans = {
    Admin: [
      ['Salary', 140000, 'Executive salary credit'],
      ['Business', 22000, 'Consulting revenue received'],
      ['Investment', 12500, 'Portfolio return credited']
    ],
    'Finance Manager': [
      ['Salary', 98000, 'Monthly salary credit'],
      ['Bonus', 12000, 'Quarterly leadership bonus'],
      ['Investment', 7000, 'Debt fund and dividend income']
    ],
    Analyst: [
      ['Salary', 78000, 'Monthly salary credit'],
      ['Freelance', 9500, 'Data modelling side project']
    ],
    Employee: [
      ['Salary', 62000, 'Monthly salary credit'],
      ['Commission', 6000, 'Performance incentive payout']
    ],
    User: [
      ['Salary', 54000, 'Monthly salary credit'],
      ['Freelance', 5000, 'Weekend freelance assignment']
    ],
    Viewer: [
      ['Salary', 47000, 'Monthly salary credit']
    ]
  };

  return (plans[roleName] || plans.User).map(([category, base, notes], itemIndex) => ({
    type: 'Income',
    category,
    amount: makeAmount(base, monthIndex + itemIndex, userIndex, 4500),
    notes
  }));
};

const buildExpensePlan = (roleName, monthIndex, userIndex) => {
  const plans = {
    Admin: [
      ['Housing', 32000, 'Home loan and maintenance'],
      ['Food & Dining', 11000, 'Family groceries and dining'],
      ['Transport', 8500, 'Fuel and daily commute'],
      ['Utilities', 6200, 'Electricity, water and gas'],
      ['Shopping', 9000, 'Personal and household purchases'],
      ['Travel', 12000, 'Client and family travel']
    ],
    'Finance Manager': [
      ['Housing', 26000, 'Rent and maintenance'],
      ['Food & Dining', 9000, 'Groceries and dining'],
      ['Transport', 6500, 'Cab and fuel expenses'],
      ['Utilities', 5400, 'Internet, phone and utilities'],
      ['Healthcare', 4500, 'Insurance and pharmacy'],
      ['Entertainment', 5200, 'Streaming and leisure']
    ],
    Analyst: [
      ['Housing', 22000, 'Rent payment'],
      ['Groceries', 7600, 'Monthly groceries'],
      ['Transport', 5400, 'Metro and cab fare'],
      ['Internet', 1700, 'High-speed internet'],
      ['Education', 4200, 'Certification and books'],
      ['Healthcare', 2800, 'Wellness and medicines']
    ],
    Employee: [
      ['Housing', 18000, 'Shared apartment rent'],
      ['Groceries', 6200, 'Kitchen and essentials'],
      ['Fuel', 4200, 'Bike fuel'],
      ['Phone Bill', 900, 'Mobile plan'],
      ['Entertainment', 2600, 'Movies and subscriptions'],
      ['Savings', 4500, 'Recurring deposit transfer']
    ],
    User: [
      ['Housing', 16000, 'Apartment rent'],
      ['Food & Dining', 5800, 'Meals and groceries'],
      ['Transport', 3500, 'Commute expenses'],
      ['Utilities', 2600, 'Electricity and water'],
      ['Shopping', 3100, 'Essentials and clothing'],
      ['Savings', 3800, 'Automatic savings transfer']
    ],
    Viewer: [
      ['Housing', 15000, 'Family contribution'],
      ['Groceries', 5200, 'Household groceries'],
      ['Utilities', 2400, 'Internet and electricity'],
      ['Healthcare', 2200, 'Health expenses'],
      ['Entertainment', 1800, 'Subscriptions and outings']
    ]
  };

  return (plans[roleName] || plans.User).map(([category, base, notes], itemIndex) => ({
    type: 'Expense',
    category,
    amount: makeAmount(base, monthIndex + itemIndex, userIndex, 2400),
    notes
  }));
};

const ensureRoles = async () => {
  const rolesByName = {};

  for (const [name, permissions] of Object.entries(ROLE_PERMISSIONS)) {
    const [role] = await Role.findOrCreate({
      where: { name },
      defaults: { permissions }
    });

    await role.update({ permissions, is_deleted: false });
    rolesByName[name] = role;
  }

  return rolesByName;
};

const upsertDemoUsers = async (rolesByName) => {
  const demoEmails = DEMO_USERS.map((user) => user.email);
  const existingUsers = await User.findAll({ where: { email: { [Op.in]: demoEmails } } });
  const existingUserIds = existingUsers.map((user) => user.id);

  if (existingUserIds.length > 0) {
    const existingRecordIds = (
      await FinancialRecord.findAll({
        where: { user_id: { [Op.in]: existingUserIds } },
        attributes: ['id']
      })
    ).map((record) => record.id);

    await EmailLog.destroy({ where: { user_id: { [Op.in]: existingUserIds } }, force: true });
    await EditDeleteRequest.destroy({
      where: {
        [Op.or]: [
          { user_id: { [Op.in]: existingUserIds } },
          { admin_id: { [Op.in]: existingUserIds } },
          { record_id: { [Op.in]: existingRecordIds.length > 0 ? existingRecordIds : [-1] } }
        ]
      },
      force: true
    });
    await FinancialRecord.destroy({ where: { user_id: { [Op.in]: existingUserIds } }, force: true });
  }

  const seededUsers = [];

  for (const demoUser of DEMO_USERS) {
    const role = rolesByName[demoUser.roleName];
    const existingUser = existingUsers.find((user) => user.email === demoUser.email);

    if (existingUser) {
      await existingUser.update({
        name: demoUser.name,
        password: DEMO_PASSWORD,
        role_id: role.id,
        status: demoUser.status,
        preferences: getDefaultUserPreferences(),
        is_deleted: false,
        reset_token: null,
        reset_token_expiry: null
      });
      seededUsers.push(existingUser);
    } else {
      const createdUser = await User.create({
        name: demoUser.name,
        email: demoUser.email,
        password: DEMO_PASSWORD,
        role_id: role.id,
        status: demoUser.status,
        preferences: getDefaultUserPreferences()
      });
      seededUsers.push(createdUser);
    }
  }

  return seededUsers;
};

const seedFinancialRecords = async (seededUsers, rolesByName) => {
  const records = [];
  const currentMonthStart = moment().startOf('month');

  seededUsers.forEach((user, userIndex) => {
    const roleName = Object.keys(rolesByName).find((name) => rolesByName[name].id === user.role_id) || 'User';

    for (let monthOffset = 5; monthOffset >= 0; monthOffset -= 1) {
      const monthDate = currentMonthStart.clone().subtract(monthOffset, 'months');
      const incomeEntries = buildIncomePlan(roleName, monthOffset, userIndex);
      const expenseEntries = buildExpensePlan(roleName, monthOffset, userIndex);
      const entries = [...incomeEntries, ...expenseEntries];

      entries.forEach((entry, entryIndex) => {
        const date = monthDate.clone().date(Math.min(4 + entryIndex * 3, 26));

        records.push({
          user_id: user.id,
          type: entry.type,
          category: entry.category,
          amount: entry.amount,
          date: date.format('YYYY-MM-DD'),
          notes: `${entry.notes} for ${monthLabel(date)}`
        });
      });
    }
  });

  return FinancialRecord.bulkCreate(records, { returning: true });
};

const seedRequests = async (seededUsers, createdRecords) => {
  const adminUser = seededUsers.find((user) => user.email === 'admin@finance.com');
  const employeeUser = seededUsers.find((user) => user.email === 'employee@finance.demo');
  const regularUser = seededUsers.find((user) => user.email === 'user@finance.demo');

  const employeeRecords = createdRecords.filter((record) => record.user_id === employeeUser.id && record.type === 'Expense');
  const regularUserRecords = createdRecords.filter((record) => record.user_id === regularUser.id && record.type === 'Expense');

  const pendingEditRecord = employeeRecords[0];
  const approvedEditRecord = employeeRecords[1];
  const rejectedDeleteRecord = regularUserRecords[0];
  const pendingDeleteRecord = regularUserRecords[1];

  const requests = await EditDeleteRequest.bulkCreate([
    {
      user_id: employeeUser.id,
      record_id: pendingEditRecord.id,
      type: 'Edit',
      requested_changes: {
        amount: Number(pendingEditRecord.amount) + 800,
        notes: 'Corrected grocery bill after adding weekend shopping'
      },
      reason: 'Need to correct the grocery total after updating the invoice.',
      status: 'Pending'
    },
    {
      user_id: employeeUser.id,
      record_id: approvedEditRecord.id,
      type: 'Edit',
      requested_changes: {
        amount: Number(approvedEditRecord.amount) - 500,
        notes: 'Insurance claim adjusted after reimbursement'
      },
      reason: 'The reimbursement reduced the original healthcare expense.',
      status: 'Approved',
      admin_id: adminUser.id,
      admin_notes: 'Verified with the reimbursement receipt and approved.'
    },
    {
      user_id: regularUser.id,
      record_id: rejectedDeleteRecord.id,
      type: 'Delete',
      requested_changes: null,
      reason: 'Requested deletion because the expense was duplicated.',
      status: 'Rejected',
      admin_id: adminUser.id,
      admin_notes: 'Duplicate not confirmed. Keep the original record for audit.'
    },
    {
      user_id: regularUser.id,
      record_id: pendingDeleteRecord.id,
      type: 'Delete',
      requested_changes: null,
      reason: 'This category was entered incorrectly and should be removed.',
      status: 'Pending'
    }
  ], { returning: true });

  await approvedEditRecord.update({
    amount: Number(approvedEditRecord.amount) - 500,
    notes: 'Insurance claim adjusted after reimbursement'
  });

  return requests;
};

const seedEmailLogs = async (seededUsers, requests) => {
  const registrationLogs = seededUsers.map((user) => ({
    user_id: user.id,
    to_email: user.email,
    subject: 'Welcome to Finance Management System Demo',
    body: `Demo account created for ${user.name}. Login password: ${DEMO_PASSWORD}`,
    email_type: 'Registration',
    status: 'Sent',
    sent_at: new Date()
  }));

  const requestLogs = requests.map((request) => ({
    user_id: request.user_id,
    to_email: seededUsers.find((user) => user.id === request.user_id).email,
    subject: `${request.type} request ${request.status.toLowerCase()}`,
    body: `Your ${request.type.toLowerCase()} request for record #${request.record_id} is currently ${request.status}.`,
    email_type:
      request.type === 'Edit'
        ? request.status === 'Approved'
          ? 'EditRequestApproved'
          : request.status === 'Rejected'
            ? 'EditRequestRejected'
            : 'EditRequestSubmitted'
        : request.status === 'Approved'
          ? 'DeleteRequestApproved'
          : request.status === 'Rejected'
            ? 'DeleteRequestRejected'
            : 'DeleteRequestSubmitted',
    status: 'Sent',
    sent_at: new Date()
  }));

  await EmailLog.bulkCreate([...registrationLogs, ...requestLogs]);
};

const seedAppSettings = async (adminUser) => {
  const settings = getDefaultAppSettings();
  settings.backup.lastBackupAt = moment().subtract(2, 'hours').toISOString();

  const [record] = await AppSetting.findOrCreate({
    where: { key: 'global' },
    defaults: {
      settings,
      updated_by: adminUser?.id || null
    }
  });

  await record.update({
    settings,
    updated_by: adminUser?.id || null
  });
};

const seedData = async () => {
  try {
    console.log('Seeding demo data...');
    await sequelize.authenticate();

    const rolesByName = await ensureRoles();
    const seededUsers = await upsertDemoUsers(rolesByName);
    const createdRecords = await seedFinancialRecords(seededUsers, rolesByName);
    const requests = await seedRequests(seededUsers, createdRecords);
    await seedEmailLogs(seededUsers, requests);
    await seedAppSettings(seededUsers.find((user) => user.email === 'admin@finance.com'));

    console.log('Demo seeding complete.');
    console.log('');
    console.log('Demo login credentials:');
    DEMO_USERS.forEach((user) => {
      console.log(`- ${user.roleName}: ${user.email} / ${DEMO_PASSWORD}`);
    });
    console.log('');
    console.log(`Created/updated ${seededUsers.length} demo users`);
    console.log(`Created ${createdRecords.length} financial records`);
    console.log(`Created ${requests.length} edit/delete requests`);
    console.log(`Created ${seededUsers.length + requests.length} email log entries`);
  } catch (error) {
    console.error('Demo seeding failed:', error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
};

if (require.main === module) {
  seedData();
}

module.exports = seedData;
