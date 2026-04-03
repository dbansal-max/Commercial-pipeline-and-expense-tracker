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

const getRoleName = (userRole) => userRole?.name || userRole || 'User';

const SuggestionsCard = ({ title, suggestions, icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    purple: 'bg-purple-50 border-purple-200 text-purple-900'
  };

  return (
    <div className={`border rounded-lg p-5 ${colorClasses[color]}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-6 h-6">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="font-semibold mb-3">{title}</h4>
          <ul className="space-y-2 text-sm">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">-</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export const FinancialSuggestions = ({ data, userRole }) => {
  const roleName = getRoleName(userRole);
  const totalIncome = toNumber(data?.totalIncome);
  const totalExpense = toNumber(data?.totalExpense);
  const savings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;
  const expenseRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0;
  const categories = (data?.topExpenseCategories || []).map((category) => ({
    category: category.category,
    amount: toNumber(category.amount || category.totalAmount)
  }));
  const topCategory = categories[0];

  const suggestions = [];

  if (totalIncome === 0 && totalExpense === 0) {
    suggestions.push({
      title: 'Getting Started',
      color: 'blue',
      suggestions: [
        'Add at least one income record and a few expense records to unlock detailed monthly analysis.',
        'Use categories like Housing, Groceries, Transport, and Utilities so the dashboard can identify spending patterns.',
        'Once data is available, this section will highlight savings rate, budget pressure, and high-impact actions.'
      ],
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
        </svg>
      )
    });
  } else {
    suggestions.push({
      title: 'Cash Flow Health',
      color: savings >= 0 ? 'green' : 'red',
      suggestions: [
        `Income for the current period is ${formatCurrency(totalIncome)} and expenses are ${formatCurrency(totalExpense)}.`,
        savings >= 0
          ? `You are operating with a positive balance of ${formatCurrency(savings)}, which is ${savingsRate.toFixed(1)}% of income.`
          : `You are currently overspending by ${formatCurrency(Math.abs(savings))}; focus on cutting variable expenses first.`,
        expenseRatio > 80
          ? 'Your spending load is heavy relative to income, so the next best move is to pause discretionary purchases for a cycle.'
          : 'Your expense ratio is in a manageable range, so you can start pushing more of the surplus into savings or investments.'
      ],
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1" />
        </svg>
      )
    });

    if (topCategory) {
      const topCategoryShare = totalExpense > 0 ? (topCategory.amount / totalExpense) * 100 : 0;
      suggestions.push({
        title: `${topCategory.category} Pressure`,
        color: topCategoryShare >= 28 ? 'yellow' : 'blue',
        suggestions: [
          `${topCategory.category} is your biggest expense bucket at ${formatCurrency(topCategory.amount)}.`,
          `That is ${topCategoryShare.toFixed(1)}% of total expenses, so even a 10% reduction here would free up ${formatCurrency(topCategory.amount * 0.1)}.`,
          `Review recurring charges, subscriptions, and one-off leakage inside ${topCategory.category} before cutting productive spending elsewhere.`
        ],
        icon: (
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6m4 6V7m4 10v-4M5 21h14" />
          </svg>
        )
      });
    }

    suggestions.push({
      title: savings >= 0 ? 'Savings Strategy' : 'Recovery Plan',
      color: savings >= 0 ? 'green' : 'red',
      suggestions: savings >= 0
        ? [
            `A healthy next target is to move at least ${formatCurrency(Math.max(totalIncome * 0.2, savings))} into savings and long-term investments this month.`,
            'Split the surplus into emergency fund, short-term goals, and wealth-building investments instead of keeping everything idle.',
            'Automating the transfer right after salary credit will make your current positive trend more consistent.'
          ]
        : [
            `Closing the gap requires reducing spending or increasing income by at least ${formatCurrency(Math.abs(savings))} this period.`,
            'Start with high-flex categories such as Food & Dining, Shopping, Entertainment, and Travel before touching essentials.',
            'If the deficit repeats for multiple months, create a strict cap for discretionary spend and track weekly instead of monthly.'
          ],
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2m0-6l4 4m0 0l-4 4m4-4H9" />
        </svg>
      )
    });
  }

  if (['Admin', 'Analyst', 'Finance Manager'].includes(roleName) && totalIncome > 0) {
    suggestions.push({
      title: 'Decision Support',
      color: 'purple',
      suggestions: [
        'Use the dashboard trend view to compare current month income quality with prior months before approving budget increases.',
        'Track whether large categories are growing faster than income; that is the clearest signal of structural cost pressure.',
        'A strong operating pattern is consistent surplus, controlled fixed costs, and no single expense category dominating the month.'
      ],
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5h2m-1 0v14m-7-7h14" />
        </svg>
      )
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Financial Insights & Suggestions</h3>
      {suggestions.map((suggestion, index) => (
        <SuggestionsCard
          key={`${suggestion.title}-${index}`}
          title={suggestion.title}
          suggestions={suggestion.suggestions}
          icon={suggestion.icon}
          color={suggestion.color}
        />
      ))}
    </div>
  );
};

export const BudgetRecommendations = ({ monthlyData, userRole }) => {
  const roleName = getRoleName(userRole);
  const validMonths = (monthlyData || []).map((month) => ({
    month: month.month,
    income: toNumber(month.income),
    expense: toNumber(month.expense),
    savings: toNumber(month.income) - toNumber(month.expense)
  })).filter((month) => month.income > 0 || month.expense > 0);

  if (validMonths.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Smart Budget Recommendations</h3>
        <div className="bg-white shadow rounded-lg p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Budget Setup Guidance</h4>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start"><span className="mr-2">-</span><span>Add records for a few months to unlock budget baselines and performance analysis.</span></li>
            <li className="flex items-start"><span className="mr-2">-</span><span>Once trends are available, this panel will calculate realistic limits for needs, wants, and savings.</span></li>
            <li className="flex items-start"><span className="mr-2">-</span><span>You will also get early warnings when expenses rise faster than income.</span></li>
          </ul>
        </div>
      </div>
    );
  }

  const totalIncome = validMonths.reduce((sum, month) => sum + month.income, 0);
  const totalExpense = validMonths.reduce((sum, month) => sum + month.expense, 0);
  const avgMonthlyIncome = totalIncome / validMonths.length;
  const avgMonthlyExpense = totalExpense / validMonths.length;
  const avgMonthlySavings = avgMonthlyIncome - avgMonthlyExpense;
  const positiveMonths = validMonths.filter((month) => month.savings >= 0).length;
  const bestMonth = [...validMonths].sort((a, b) => b.savings - a.savings)[0];
  const worstMonth = [...validMonths].sort((a, b) => a.savings - b.savings)[0];
  const savingsShare = avgMonthlyIncome > 0 ? (avgMonthlySavings / avgMonthlyIncome) * 100 : 0;

  const recommendations = [
    {
      title: 'Monthly Budget Blueprint',
      priority: avgMonthlySavings < 0 ? 'high' : avgMonthlySavings < avgMonthlyIncome * 0.15 ? 'medium' : 'low',
      items: [
        `Average monthly income is ${formatCurrency(avgMonthlyIncome)} and average monthly expense is ${formatCurrency(avgMonthlyExpense)}.`,
        `A balanced 50/30/20 plan would allocate about ${formatCurrency(avgMonthlyIncome * 0.5)} to essentials, ${formatCurrency(avgMonthlyIncome * 0.3)} to flexible spend, and ${formatCurrency(avgMonthlyIncome * 0.2)} to savings.`,
        avgMonthlySavings >= 0
          ? `You are currently saving about ${formatCurrency(avgMonthlySavings)} per month, or ${savingsShare.toFixed(1)}% of income.`
          : `You are currently running a monthly deficit of ${formatCurrency(Math.abs(avgMonthlySavings))}, so discretionary categories need tighter limits.`
      ]
    },
    {
      title: 'Trend Strength',
      priority: positiveMonths >= validMonths.length - 1 ? 'low' : 'medium',
      items: [
        `${positiveMonths} out of ${validMonths.length} tracked months closed with a positive balance.`,
        `Best month: ${bestMonth.month} with a surplus of ${formatCurrency(bestMonth.savings)}.`,
        `Weakest month: ${worstMonth.month} with ${worstMonth.savings >= 0 ? `a smaller surplus of ${formatCurrency(worstMonth.savings)}` : `a deficit of ${formatCurrency(Math.abs(worstMonth.savings))}`}.`
      ]
    }
  ];

  if (avgMonthlySavings > 0) {
    const emergencyFundTarget = avgMonthlyExpense * 6;
    const monthsToEmergencyFund = Math.max(Math.ceil(emergencyFundTarget / avgMonthlySavings), 1);
    recommendations.push({
      title: 'Savings Goal Plan',
      priority: 'medium',
      items: [
        `At the current pace, you can build a six-month emergency reserve of ${formatCurrency(emergencyFundTarget)} in about ${monthsToEmergencyFund} months.`,
        `Direct at least ${formatCurrency(Math.max(avgMonthlySavings * 0.5, avgMonthlyIncome * 0.1))} into long-term investing once emergency reserves are covered.`,
        'Keep fixed obligations stable and let raises or bonus income flow into savings first, not lifestyle inflation.'
      ]
    });
  } else {
    recommendations.push({
      title: 'Deficit Recovery Actions',
      priority: 'high',
      items: [
        `You need to recover at least ${formatCurrency(Math.abs(avgMonthlySavings))} per month to break even.`,
        'Reduce variable categories first, then review fixed costs such as rent, transport commitments, and subscriptions.',
        'If income is irregular, set spending caps from your lowest-income month rather than your best month.'
      ]
    });
  }

  if (['Admin', 'Analyst', 'Finance Manager'].includes(roleName)) {
    recommendations.push({
      title: 'Professional Financial Planning',
      priority: 'low',
      items: [
        'Use rolling three-month averages when reviewing performance so one unusual month does not distort decisions.',
        'Separate fixed-cost growth from discretionary-cost growth to identify whether the budget issue is structural or behavioral.',
        'Track savings rate and top-category concentration together; that combination gives a stronger signal than total expense alone.'
      ]
    });
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Smart Budget Recommendations</h3>
      {recommendations.map((recommendation, index) => (
        <div key={`${recommendation.title}-${index}`} className="bg-white shadow rounded-lg p-6">
          <div className="flex items-start justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">{recommendation.title}</h4>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              recommendation.priority === 'high'
                ? 'bg-red-100 text-red-800'
                : recommendation.priority === 'medium'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-green-100 text-green-800'
            }`}>
              {recommendation.priority} priority
            </span>
          </div>
          <ul className="space-y-2 text-sm text-gray-700">
            {recommendation.items.map((item, itemIndex) => (
              <li key={itemIndex} className="flex items-start">
                <span className="mr-2">-</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
