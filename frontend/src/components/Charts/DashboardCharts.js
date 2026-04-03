import React from 'react';

const toNumber = (value) => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
};

const formatCurrency = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(toNumber(value));

const ChartCard = ({ title, children, className = '' }) => (
  <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
    <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
    {children}
  </div>
);

export const MonthlyTrendChart = ({ data }) => {
  const points = (data || []).map((item) => ({
    month: item.month,
    income: toNumber(item.income),
    expense: toNumber(item.expense)
  })).filter((item) => item.income > 0 || item.expense > 0);

  if (points.length === 0) {
    return (
      <ChartCard title="Monthly Income vs Expenses Trend">
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No trend data available yet</p>
        </div>
      </ChartCard>
    );
  }

  const maxAmount = Math.max(
    ...points.map((item) => Math.max(item.income, item.expense)),
    1
  );

  return (
    <ChartCard title="Monthly Income vs Expenses Trend">
      <div className="h-64 flex items-end justify-between gap-3">
        {points.map((item, index) => (
          <div key={`${item.month}-${index}`} className="flex-1 min-w-0">
            <div className="h-52 flex items-end justify-center gap-1">
              <div className="w-5 sm:w-7 bg-green-500 rounded-t" style={{ height: `${(item.income / maxAmount) * 100}%` }} title={`Income: ${formatCurrency(item.income)}`} />
              <div className="w-5 sm:w-7 bg-red-500 rounded-t" style={{ height: `${(item.expense / maxAmount) * 100}%` }} title={`Expense: ${formatCurrency(item.expense)}`} />
            </div>
            <div className="text-xs text-center mt-2 text-gray-600">{item.month}</div>
          </div>
        ))}
      </div>
      <div className="flex justify-center mt-4 space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span className="text-gray-600">Income</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
          <span className="text-gray-600">Expenses</span>
        </div>
      </div>
    </ChartCard>
  );
};

export const CategoryPieChart = ({ data }) => {
  const items = (data || []).map((item) => ({
    category: item.category,
    amount: toNumber(item.amount)
  })).filter((item) => item.amount > 0);

  if (items.length === 0) {
    return (
      <ChartCard title="Expense Distribution by Category">
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No category data available yet</p>
        </div>
      </ChartCard>
    );
  }

  const total = items.reduce((sum, item) => sum + item.amount, 0);
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500'
  ];

  return (
    <ChartCard title="Expense Distribution by Category">
      <div className="space-y-3">
        {items.map((item, index) => {
          const share = total > 0 ? (item.amount / total) * 100 : 0;

          return (
            <div key={`${item.category}-${index}`}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{item.category}</span>
                <span className="font-medium text-gray-900">{formatCurrency(item.amount)} ({share.toFixed(1)}%)</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className={`${colors[index % colors.length]} h-3 rounded-full`}
                  style={{ width: `${share}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </ChartCard>
  );
};

export const SavingsGoalChart = ({ current, goal, month }) => {
  const safeCurrent = toNumber(current);
  const safeGoal = toNumber(goal);
  const remaining = Math.max(safeGoal - safeCurrent, 0);
  const percentage = safeGoal > 0 ? Math.min((safeCurrent / safeGoal) * 100, 100) : 0;

  let message = 'Add more income data to generate a clearer savings target.';
  if (safeGoal > 0 && safeCurrent >= safeGoal) {
    message = 'Excellent progress. You have already reached or exceeded this savings target.';
  } else if (safeGoal > 0 && safeCurrent > 0) {
    message = `You need ${formatCurrency(remaining)} more to reach this goal.`;
  } else if (safeGoal > 0) {
    message = `Start building toward ${formatCurrency(safeGoal)} by locking in a fixed monthly savings transfer.`;
  }

  return (
    <ChartCard title={`Savings Goal - ${month}`}>
      <div className="space-y-4">
        <div className="w-full bg-gray-200 rounded-full h-8 overflow-hidden">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-8 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
            style={{ width: `${percentage}%` }}
          >
            {percentage >= 12 && (
              <span className="text-white text-sm font-medium">{percentage.toFixed(1)}%</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(safeCurrent)}</div>
            <div className="text-sm text-gray-500">Current</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-700">{formatCurrency(safeGoal)}</div>
            <div className="text-sm text-gray-500">Goal</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(remaining)}</div>
            <div className="text-sm text-gray-500">Remaining</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          {message}
        </div>
      </div>
    </ChartCard>
  );
};

export const BudgetTracker = ({ budget, spent, category }) => {
  const safeBudget = Math.max(toNumber(budget), 1);
  const safeSpent = toNumber(spent);
  const percentage = Math.min((safeSpent / safeBudget) * 100, 100);
  const remaining = safeBudget - safeSpent;
  const isOverBudget = safeSpent > safeBudget;

  return (
    <ChartCard title={`Budget Tracker - ${category}`}>
      <div className="space-y-4">
        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
          <div
            className={`h-6 rounded-full transition-all duration-500 ${
              isOverBudget ? 'bg-red-500' : percentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          >
            {percentage >= 20 && (
              <div className="h-full flex items-center justify-end pr-2 text-white text-xs font-medium">
                {percentage.toFixed(1)}%
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className={`text-lg font-bold ${isOverBudget ? 'text-red-600' : 'text-blue-600'}`}>
              {formatCurrency(safeSpent)}
            </div>
            <div className="text-sm text-gray-500">Spent</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-700">{formatCurrency(safeBudget)}</div>
            <div className="text-sm text-gray-500">Budget</div>
          </div>
          <div>
            <div className={`text-lg font-bold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(Math.abs(remaining))}
            </div>
            <div className="text-sm text-gray-500">{remaining < 0 ? 'Over' : 'Remaining'}</div>
          </div>
        </div>

        <div className={`rounded-lg p-3 text-sm ${
          isOverBudget
            ? 'bg-red-50 border border-red-200 text-red-800'
            : percentage > 80
              ? 'bg-yellow-50 border border-yellow-200 text-yellow-800'
              : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {isOverBudget
            ? `You are over budget in ${category} by ${formatCurrency(Math.abs(remaining))}.`
            : percentage > 80
              ? `${category} is close to the planned limit, so watch new spending carefully.`
              : `${category} is within budget and currently under control.`}
        </div>
      </div>
    </ChartCard>
  );
};
