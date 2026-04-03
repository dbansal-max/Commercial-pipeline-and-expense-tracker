import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';

const UserAnalysis = ({ userRole = 'Admin' }) => {
  const [userAnalysis, setUserAnalysis] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    fetchUserAnalysis();
  }, [selectedPeriod, sortBy, sortOrder, userRole]);

  const fetchUserAnalysis = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getUserAnalysis?.({
        period: selectedPeriod,
        sortBy,
        sortOrder
      });

      let data = response?.data?.data?.users || [];

      // Filter by selected user if specified
      if (selectedUser) {
        data = data.filter(user => user.id === selectedUser);
      }

      setUserAnalysis(data);
    } catch (error) {
      console.error('Failed to fetch user analysis:', error);
      setError('Failed to fetch user analysis');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalIncome = (user) => {
    return user.income || 0;
  };

  const calculateTotalExpenses = (user) => {
    return user.expenses || 0;
  };

  const calculateSavingsRate = (user) => {
    return user.savingsRate || 0;
  };

  const getTopExpenseCategory = (user) => {
    return [user.topExpenseCategory || 'N/A', user.topExpenseAmount || 0];
  };

  const getPerformanceBadge = (savingsRate) => {
    if (savingsRate >= 30) return { color: 'bg-green-100 text-green-800', text: 'Excellent' };
    if (savingsRate >= 20) return { color: 'bg-blue-100 text-blue-800', text: 'Good' };
    if (savingsRate >= 10) return { color: 'bg-yellow-100 text-yellow-800', text: 'Average' };
    return { color: 'bg-red-100 text-red-800', text: 'Poor' };
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Financial Analysis</h2>
          <p className="text-gray-600 mt-1">Detailed expense and income analysis per user</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">Today</option>
            <option value="weekly">This Week</option>
            <option value="monthly">This Month</option>
            <option value="quarterly">This Quarter</option>
            <option value="yearly">This Year</option>
          </select>

          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Users</option>
            {userAnalysis.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users Analyzed</p>
              <p className="text-2xl font-bold text-green-600">
                {userAnalysis.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{userAnalysis.reduce((sum, user) => sum + calculateTotalIncome(user), 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-red-100 rounded-lg p-3">
              <span className="text-2xl">💸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">
                ₹{userAnalysis.reduce((sum, user) => sum + calculateTotalExpenses(user), 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
              <span className="text-2xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Savings Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {userAnalysis.length > 0
                  ? (userAnalysis.reduce((sum, user) => {
                    return sum + calculateSavingsRate(user);
                  }, 0) / userAnalysis.length).toFixed(1)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Analysis Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Individual User Performance</h3>
        </div>
        <div className="overflow-x-auto">
          {userAnalysis.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">📊</span>
              <p className="text-gray-500">No user data available</p>
              <p className="text-gray-400 text-sm mt-1">Try selecting a different period</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      User
                      {sortBy === 'name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('income')}
                  >
                    <div className="flex items-center">
                      Total Income
                      {sortBy === 'income' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('expenses')}
                  >
                    <div className="flex items-center">
                      Total Expenses
                      {sortBy === 'expenses' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('netBalance')}
                  >
                    <div className="flex items-center">
                      Net Balance
                      {sortBy === 'netBalance' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('savingsRate')}
                  >
                    <div className="flex items-center">
                      Savings Rate
                      {sortBy === 'savingsRate' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Top Expense Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userAnalysis.map((user) => {
                  const totalIncome = calculateTotalIncome(user);
                  const totalExpenses = calculateTotalExpenses(user);
                  const netBalance = totalIncome - totalExpenses;
                  const savingsRate = calculateSavingsRate(user);
                  const [topCategory, topCategoryAmount] = getTopExpenseCategory(user);
                  const performance = getPerformanceBadge(savingsRate);

                  return (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                            <div className="text-xs text-gray-400">{user.role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{totalIncome.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{totalExpenses.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span className={netBalance >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ₹{Math.abs(netBalance).toLocaleString('en-IN')}
                          {netBalance < 0 && ' (Loss)'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <span className={`font-medium ${savingsRate >= 20 ? 'text-green-600' :
                            savingsRate >= 10 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {savingsRate}%
                          </span>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${savingsRate >= 20 ? 'bg-green-500' :
                                savingsRate >= 10 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                              style={{ width: `${Math.min(savingsRate, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{topCategory}</div>
                          <div className="text-gray-500">₹{topCategoryAmount.toLocaleString('en-IN')}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${performance.color}`}>
                          {performance.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserAnalysis;
