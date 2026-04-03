import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';

const Trends = () => {
  const [trends, setTrends] = useState([]);
  const [userTrends, setUserTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedMetric, setSelectedMetric] = useState('both');
  const [selectedUser, setSelectedUser] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserRole(user?.role?.name || 'User');
  }, []);

  useEffect(() => {
    fetchTrends();
    if (userRole === 'Admin' || userRole === 'Analyst') {
      fetchUserTrends();
    }
  }, [selectedPeriod, selectedMetric, selectedUser, userRole]);

  const fetchTrends = async () => {
    try {
      setLoading(true);

      // Map frontend period selections to backend period format
      let backendPeriod = 'monthly';
      if (selectedPeriod === '1month' || selectedPeriod === '3months' || selectedPeriod === '6months') {
        backendPeriod = 'monthly';
      } else if (selectedPeriod === '1year') {
        backendPeriod = 'yearly';
      } else if (selectedPeriod === '2years') {
        backendPeriod = 'yearly';
      }

      console.log('🔍 Fetching trends with period:', backendPeriod, 'userId:', selectedUser);
      const response = await dashboardAPI.getTrends?.({
        period: backendPeriod,
        userId: selectedUser
      });

      console.log('🔍 Trends API Response:', response);
      console.log('🔍 Response data structure:', JSON.stringify(response?.data, null, 2));

      // Handle the enhanced backend response structure
      if (response?.data?.success && response?.data?.data?.trends) {
        const trendsData = response.data.data.trends;
        console.log('🔍 Setting trends data:', trendsData.length, 'items');
        console.log('🔍 First trend item:', JSON.stringify(trendsData[0], null, 2));
        setTrends(trendsData);
      } else {
        console.log('🔍 No trends data found, setting empty array');
        setTrends([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch trends:', error);
      setError('Failed to fetch trends');
      setTrends([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserTrends = async () => {
    try {
      const response = await dashboardAPI.getTrends?.({
        period: 'monthly'
      });

      console.log('🔍 User Trends API Response:', response);

      // Extract user trends from the enhanced response
      if (response?.data?.success && response?.data?.data?.userTrends) {
        const userTrendsData = response.data.data.userTrends;
        console.log('🔍 Setting user trends data:', userTrendsData.length, 'items');
        setUserTrends(userTrendsData);
      } else {
        console.log('🔍 No user trends data found, setting empty array');
        setUserTrends([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user trends:', error);
      setUserTrends([]);
    }
  };

  const calculateGrowthRate = (current, previous) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  const getTrendColor = (value) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = (value) => {
    if (value > 0) return '📈';
    if (value < 0) return '📉';
    return '➡️';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial trends...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center">
          <span className="text-4xl mb-4 block">❌</span>
          <p className="text-red-600 font-medium">{error}</p>
          <button
            onClick={fetchTrends}
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Financial Trends Analysis</h2>
          <p className="text-gray-600 mt-1">Track and analyze financial trends over time</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="1month">Last Month</option>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="1year">Last Year</option>
            <option value="2years">Last 2 Years</option>
          </select>

          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="both">Income & Expenses</option>
            <option value="income">Income Only</option>
            <option value="expenses">Expenses Only</option>
            <option value="savings">Savings Rate</option>
          </select>

          {(userRole === 'Admin' || userRole === 'Analyst') && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              {userTrends.map(user => (
                <option key={user.userId} value={user.userId}>
                  {user.userName} ({user.userEmail})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Income Trend</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{(Array.isArray(trends) ? trends.reduce((sum, t) => sum + (t.income || 0), 0) : 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-lg mr-1">📈</span>
                <span className="text-sm text-green-600">
                  +{Array.isArray(trends) && trends.length > 1 ? calculateGrowthRate(
                    trends[trends.length - 1]?.income || 0,
                    trends[trends.length - 2]?.income || 0
                  ) : 0}%
                </span>
              </div>
            </div>
            <div className="bg-green-100 rounded-lg p-3">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses Trend</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{(Array.isArray(trends) ? trends.reduce((sum, t) => sum + (t.expense || 0), 0) : 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-lg mr-1">📉</span>
                <span className="text-sm text-red-600">
                  {Array.isArray(trends) && trends.length > 1 ? calculateGrowthRate(
                    trends[trends.length - 1]?.expense || 0,
                    trends[trends.length - 2]?.expense || 0
                  ) : 0}%
                </span>
              </div>
            </div>
            <div className="bg-red-100 rounded-lg p-3">
              <span className="text-2xl">💸</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Net Balance Trend</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{(Array.isArray(trends) ? trends.reduce((sum, t) => sum + ((t.income || 0) - (t.expense || 0)), 0) : 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-lg mr-1">💎</span>
                <span className="text-sm text-purple-600">
                  {Array.isArray(trends) && trends.reduce((sum, t) => sum + ((t.income || 0) - (t.expense || 0)), 0) >= 0 ? 'Positive' : 'Negative'}
                </span>
              </div>
            </div>
            <div className="bg-purple-100 rounded-lg p-3">
              <span className="text-2xl">💎</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Savings</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{(Array.isArray(trends) ? trends.reduce((sum, t) => {
                  const netBalance = t.netBalance !== undefined ? t.netBalance : (t.income || 0) - (t.expense || 0);
                  return sum + (netBalance > 0 ? netBalance : 0);
                }, 0) : 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-lg mr-1">🏦</span>
                <span className="text-sm text-blue-600">
                  {Array.isArray(trends) && trends.length > 0
                    ? (trends.reduce((sum, t) => {
                      const netBalance = t.netBalance !== undefined ? t.netBalance : (t.income || 0) - (t.expense || 0);
                      const savingsRate = t.savingsRate !== undefined ? t.savingsRate : (t.income > 0 ? ((netBalance / t.income) * 100) : 0);
                      return sum + savingsRate;
                    }, 0) / trends.length).toFixed(1)
                    : 0}% avg rate
                </span>
              </div>
            </div>
            <div className="bg-blue-100 rounded-lg p-3">
              <span className="text-2xl">🏦</span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Savings Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Savings Efficiency</p>
              <p className="text-2xl font-bold text-indigo-600">
                {Array.isArray(trends) && trends.length > 0
                  ? (trends.reduce((sum, t) => {
                    const netBalance = t.netBalance !== undefined ? t.netBalance : (t.income || 0) - (t.expense || 0);
                    const savingsRate = t.savingsRate !== undefined ? t.savingsRate : (t.income > 0 ? ((netBalance / t.income) * 100) : 0);
                    const savingsEfficiency = t.savingsEfficiency !== undefined ? t.savingsEfficiency : (t.income > 0 ? ((netBalance > 0 ? netBalance : 0) / t.income * 100) : 0);
                    return sum + savingsEfficiency;
                  }, 0) / trends.length).toFixed(1)
                  : 0}%
              </p>
              <div className="flex items-center mt-2">
                <span className="text-lg mr-1">📊</span>
                <span className="text-sm text-indigo-600">
                  {Array.isArray(trends) && trends.length > 0
                    ? trends.filter(t => {
                      const netBalance = t.netBalance !== undefined ? t.netBalance : (t.income || 0) - (t.expense || 0);
                      const savingsEfficiency = t.savingsEfficiency !== undefined ? t.savingsEfficiency : (t.income > 0 ? ((netBalance > 0 ? netBalance : 0) / t.income * 100) : 0);
                      return savingsEfficiency >= 20;
                    }).length
                    : 0} periods达标
                </span>
              </div>
            </div>
            <div className="bg-indigo-100 rounded-lg p-3">
              <span className="text-2xl">📊</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Savings Goals Progress</p>
              <p className="text-2xl font-bold text-teal-600">
                {Array.isArray(trends) && trends.length > 0
                  ? (trends.reduce((sum, t) => {
                    const netBalance = t.netBalance !== undefined ? t.netBalance : (t.income || 0) - (t.expense || 0);
                    const totalSavings = t.totalSavings !== undefined ? t.totalSavings : (netBalance > 0 ? netBalance : 0);
                    const savingsGoal = t.savingsGoal !== undefined ? t.savingsGoal : (t.income * 0.20);
                    const goalProgress = t.savingsGoalProgress !== undefined ? t.savingsGoalProgress : (savingsGoal > 0 ? (totalSavings / savingsGoal) * 100 : 0);
                    return sum + goalProgress;
                  }, 0) / trends.length).toFixed(1)
                  : 0}%
              </p>
              <div className="flex items-center mt-2">
                <span className="text-lg mr-1">🎯</span>
                <span className="text-sm text-teal-600">
                  {Array.isArray(trends) ? trends.filter(t => {
                    const savingsGoalAchieved = t.savingsGoalAchieved !== undefined ? t.savingsGoalAchieved :
                      (t.totalSavings !== undefined ?
                        (t.totalSavings >= (t.savingsGoal !== undefined ? t.savingsGoal : (t.income * 0.20))) : false);
                    return savingsGoalAchieved;
                  }).length : 0} achieved
                </span>
              </div>
            </div>
            <div className="bg-teal-100 rounded-lg p-3">
              <span className="text-2xl">🎯</span>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Deficit</p>
              <p className="text-2xl font-bold text-orange-600">
                ₹{(Array.isArray(trends) ? trends.reduce((sum, t) => {
                  const netBalance = t.netBalance !== undefined ? t.netBalance : (t.income || 0) - (t.expense || 0);
                  const totalDeficit = t.totalDeficit !== undefined ? t.totalDeficit : (netBalance < 0 ? Math.abs(netBalance) : 0);
                  return sum + totalDeficit;
                }, 0) : 0).toLocaleString('en-IN')}
              </p>
              <div className="flex items-center mt-2">
                <span className="text-lg mr-1">⚠️</span>
                <span className="text-sm text-orange-600">
                  {Array.isArray(trends) && trends.length > 0
                    ? trends.filter(t => {
                      const netBalance = t.netBalance !== undefined ? t.netBalance : (t.income || 0) - (t.expense || 0);
                      const totalDeficit = t.totalDeficit !== undefined ? t.totalDeficit : (netBalance < 0 ? Math.abs(netBalance) : 0);
                      return totalDeficit > 0;
                    }).length
                    : 0} periods with deficit
                </span>
              </div>
            </div>
            <div className="bg-orange-100 rounded-lg p-3">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trends Chart */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Trend Visualization</h3>

        {trends.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">📈</span>
            <p className="text-gray-500">No trend data available</p>
            <p className="text-gray-400 text-sm mt-1">Loading financial data...</p>
          </div>
        ) : (
          <div className="relative h-64 bg-gray-50 rounded-lg p-4">
            <div className="flex items-end justify-between h-full space-x-2">
              {trends.slice(-12).map((trend, index) => {
                const maxIncome = Math.max(...trends.map(t => t.income || 0));
                const maxExpense = Math.max(...trends.map(t => t.expense || 0));

                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center space-y-1">
                      {(selectedMetric === 'both' || selectedMetric === 'income') && (
                        <div
                          className="w-full bg-green-500 rounded-t"
                          style={{
                            height: `${maxIncome > 0 ? ((trend.income || 0) / maxIncome) * 100 : 0}%`,
                            minHeight: '2px'
                          }}
                          title={`Income: ₹${(trend.income || 0).toLocaleString('en-IN')}`}
                        ></div>
                      )}
                      {(selectedMetric === 'both' || selectedMetric === 'expenses') && (
                        <div
                          className="w-full bg-red-500 rounded-b"
                          style={{
                            height: `${maxExpense > 0 ? ((trend.expense || 0) / maxExpense) * 100 : 0}%`,
                            minHeight: '2px'
                          }}
                          title={`Expense: ₹${(trend.expense || 0).toLocaleString('en-IN')}`}
                        ></div>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left whitespace-nowrap">
                      {trend.periodLabel || new Date(trend.period).toLocaleDateString('en-US', { month: 'short' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex justify-center space-x-6 mt-4">
          {(selectedMetric === 'both' || selectedMetric === 'income') && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Income</span>
            </div>
          )}
          {(selectedMetric === 'both' || selectedMetric === 'expenses') && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
              <span className="text-sm text-gray-600">Expenses</span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Trend Analysis Table */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Trend Analysis</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Period
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Income
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expenses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Net Balance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Savings Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Savings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Goal Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(trends) && trends.length > 0 ? (
                trends.map((trend, index) => {
                  const previousTrend = trends[index - 1];
                  const incomeGrowth = calculateGrowthRate(trend.income || 0, previousTrend?.income || 0);
                  const expenseGrowth = calculateGrowthRate(trend.expense || 0, previousTrend?.expense || 0);
                  const netBalance = trend.netBalance !== undefined ? trend.netBalance : (trend.income || 0) - (trend.expense || 0);
                  const savingsRate = trend.savingsRate !== undefined ? trend.savingsRate : (trend.income > 0 ? ((netBalance / trend.income) * 100) : 0);
                  const totalSavings = trend.totalSavings !== undefined ? trend.totalSavings : (netBalance > 0 ? netBalance : 0);
                  const goalProgress = trend.savingsGoalProgress !== undefined ? trend.savingsGoalProgress : (trend.savingsGoal > 0 ? (totalSavings / trend.savingsGoal) * 100 : 0);

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {trend.periodLabel || new Date(trend.period).toLocaleDateString('en-US', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(trend.income || 0).toLocaleString('en-IN')}
                        {previousTrend && (
                          <div className={`text-xs ${getTrendColor(incomeGrowth)}`}>
                            {getTrendIcon(incomeGrowth)} {incomeGrowth}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{(trend.expense || 0).toLocaleString('en-IN')}
                        {previousTrend && (
                          <div className={`text-xs ${getTrendColor(expenseGrowth)}`}>
                            {getTrendIcon(expenseGrowth)} {expenseGrowth}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{netBalance.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-medium ${savingsRate >= 20 ? 'text-green-600' : savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {savingsRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className={`font-medium ${totalSavings > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                          ₹{totalSavings.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <div className="flex-1 mr-2">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${goalProgress >= 100 ? 'bg-green-500' : goalProgress >= 80 ? 'bg-blue-500' : goalProgress >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(goalProgress, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className={`font-medium ${goalProgress >= 100 ? 'text-green-600' : goalProgress >= 80 ? 'text-blue-600' : goalProgress >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                            {goalProgress.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="text-lg">
                          {getTrendIcon(netBalance)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <span className="text-4xl mb-4 block">📈</span>
                    <p className="text-gray-500">No trend data available</p>
                    <p className="text-gray-400 text-sm mt-1">Loading financial data...</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Trends;
