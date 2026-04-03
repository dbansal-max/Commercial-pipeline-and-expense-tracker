import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../services/api';
import userAPI from '../../services/userAPI';
import roleAPI from '../../services/roleAPI';
import { MonthlyTrendChart, CategoryPieChart, SavingsGoalChart, BudgetTracker } from '../../components/Charts/DashboardCharts';
import { FinancialSuggestions, BudgetRecommendations } from '../../components/Suggestions/FinancialSuggestions';
import UserManagement from '../../components/Admin/UserManagement';
import RoleManagement from '../../components/Admin/RoleManagement';
import UserCreationForm from '../../components/Admin/UserCreationForm';
import RoleCreationForm from '../../components/Admin/RoleCreationForm';
import Records from '../../components/Records/PermissionBasedRecords';
import Requests from '../Requests/Requests';
import Reports from '../../components/Reports/Reports';
import Trends from '../../components/Trends/Trends';
import UserAnalysis from '../../components/Analysis/UserAnalysis';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [categorySummary, setCategorySummary] = useState(null);
  const [trends, setTrends] = useState(null);
  const [, setReductionPlan] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [systemHealth, setSystemHealth] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
    totalRecords: 0,
    systemHealth: 'Good'
  });

  const roleName = user?.role?.name || user?.role || 'User';
  const expenseCategories = categorySummary?.expenseCategories || [];
  const trendData = (trends?.trends || []).map((item) => ({
    month: item.periodLabel || new Date(2000, Math.max(Number(item.period || 1) - 1, 0), 1).toLocaleDateString('en-US', { month: 'short' }),
    income: Number(item.income || 0),
    expense: Number(item.expense || 0),
    netBalance: Number(item.netBalance || 0),
    savingsRate: Number(item.savingsRate || 0),
    totalRecords: Number(item.totalRecords || 0)
  }));
  const expenseChartData = expenseCategories.slice(0, 5).map((item) => ({
    category: item.category,
    amount: Number(item.amount || 0)
  }));
  const topExpenseCategories = expenseCategories.slice(0, 3).map((item) => ({
    category: item.category,
    amount: Number(item.amount || 0)
  }));
  const currentSavings = Number(monthlySummary?.totalIncome || 0) - Number(monthlySummary?.totalExpense || 0);
  const savingsGoal = Number(monthlySummary?.totalIncome || 0) > 0
    ? Number((Number(monthlySummary.totalIncome) * 0.2).toFixed(0))
    : 0;
  const primaryBudgetCategory = expenseCategories[0]
    ? {
      budget: Number((Number(expenseCategories[0].amount || 0) * 1.15).toFixed(0)),
      spent: Number(expenseCategories[0].amount || 0),
      category: expenseCategories[0].category
    }
    : null;
  const quickActionClasses = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    yellow: 'bg-yellow-600 hover:bg-yellow-700'
  };
  const formatDateTime = (value) => (
    value
      ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
      : 'Not available'
  );
  const formatUptime = (seconds = 0) => {
    const totalSeconds = Number(seconds || 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const fetchDashboardData = useCallback(async () => {
    try {
      console.log('🔍 Dashboard: Starting fetchDashboardData');
      console.log('🔍 Dashboard: User role:', user?.role?.name);

      setError(null);

      console.log('🔍 Dashboard: Calling dashboard APIs...');
      const [monthlyRes, categoryRes, trendsRes, reductionRes] = await Promise.all([
        dashboardAPI.getMonthlySummary({}),
        dashboardAPI.getCategoryWiseSummary({}),
        dashboardAPI.getTrends({}),
        dashboardAPI.getReductionPlan({})
      ]);

      console.log('🔍 Dashboard: API responses:');
      console.log('  - Monthly:', monthlyRes);
      console.log('  - Category:', categoryRes);
      console.log('  - Trends:', trendsRes);
      console.log('  - Reduction:', reductionRes);

      const monthlyData = monthlyRes.data?.data || null;
      const categoryData = categoryRes.data?.data || null;
      const trendsData = trendsRes.data?.data || null;
      const reductionData = reductionRes.data?.data || null;

      console.log('🔍 Dashboard: Processed data:');
      console.log('  - Monthly data:', monthlyData);
      console.log('  - Category data:', categoryData);
      console.log('  - Trends data:', trendsData);

      setMonthlySummary(monthlyData);
      setCategorySummary(categoryData);
      setTrends(trendsData);
      setReductionPlan(reductionData);

      console.log('🔍 Dashboard: Dashboard data updated successfully');
    } catch (error) {
      console.error('❌ Dashboard: Failed to fetch dashboard data:', error);
      console.error('❌ Dashboard: Error details:', error.response?.data || error.message);
      setError('Failed to load dashboard data');
    }
  }, [user?.role?.name]);

  const fetchAdminData = useCallback(async () => {
    try {
      console.log('🔍 Dashboard: Starting fetchAdminData');

      const [statsRes, rolesRes, healthRes] = await Promise.all([
        userAPI.getAdminStats(),
        roleAPI.getRoles(),
        dashboardAPI.getSystemHealth()
      ]);

      console.log('🔍 Dashboard: Admin API responses:');
      console.log('  - Stats:', statsRes);
      console.log('  - Roles:', rolesRes);
      console.log('  - Health:', healthRes);

      const statsData = statsRes.data?.data || {
        totalUsers: 0,
        activeUsers: 0,
        totalRoles: 0,
        totalRecords: 0,
        systemHealth: 'Good'
      };
      const rolesData = rolesRes.data?.data || [];
      const healthData = healthRes.data?.data || null;

      console.log('🔍 Dashboard: Processed admin data:');
      console.log('  - Stats data:', statsData);
      console.log('  - Roles data:', rolesData);
      console.log('  - Health data:', healthData);

      setStats({
        totalUsers: statsData.totalUsers || 0,
        activeUsers: statsData.activeUsers || 0,
        totalRoles: rolesData.length || 0,
        totalRecords: statsData.totalRecords || 0,
        systemHealth: healthData?.status || statsData.systemHealth || 'Good'
      });

      console.log('🔍 Dashboard: Admin data updated successfully');
    } catch (error) {
      console.error('❌ Dashboard: Failed to fetch admin data:', error);
      console.error('❌ Dashboard: Admin error details:', error.response?.data || error.message);
      setError('Failed to load admin data');
    }
  }, []);

  useEffect(() => {
    if (hasRole('Admin')) {
      fetchAdminData();
    }
  }, [user, hasRole, fetchAdminData]);

  useEffect(() => {
    // All roles should be able to see their overview data
    if (hasRole('Admin') || hasRole('Analyst') || hasRole('Finance Manager') || hasRole('Employee') || hasRole('User') || hasRole('Viewer')) {
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  const handleUserCreated = (newUser) => {
    setShowUserForm(false);
    setStats(prev => ({
      ...prev,
      totalUsers: prev.totalUsers + 1,
      activeUsers: prev.activeUsers + 1
    }));
  };

  const handleRoleCreated = (newRole) => {
    setShowRoleForm(false);
    setStats(prev => ({
      ...prev,
      totalRoles: prev.totalRoles + 1
    }));
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          Try Again
        </button>
      </div>
    );
  }

  // Admin Role Dashboard
  if (hasRole('Admin')) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Admin Dashboard - {user?.name}
          </h1>
          <p className="mt-2 text-gray-600">
            Complete system management and analytics
          </p>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'users', label: 'User Management', icon: '👥' },
              { id: 'roles', label: 'Role Management', icon: '🔐' },
              { id: 'analytics', label: 'Analytics', icon: '📈' },
              { id: 'userAnalysis', label: 'User Analysis', icon: '👤' },
              { id: 'system', label: 'System Health', icon: '🖥️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Admin Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Active Users</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                    <span className="text-2xl">🔐</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Roles</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.totalRoles}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                    <span className="text-2xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Financial Records</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.totalRecords}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setShowUserForm(true)}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <span className="text-xl mb-2 block">➕</span>
                  Create User
                </button>
                <button
                  onClick={() => setShowRoleForm(true)}
                  className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span className="text-xl mb-2 block">🔐</span>
                  Create Role
                </button>
                <button
                  onClick={() => setActiveTab('system')}
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span className="text-xl mb-2 block">🖥️</span>
                  System Health
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="bg-yellow-600 text-white px-4 py-3 rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <span className="text-xl mb-2 block">📈</span>
                  View Analytics
                </button>
              </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MonthlyTrendChart
                data={trendData.slice(0, 6)}
              />

              <CategoryPieChart
                data={expenseChartData}
              />
            </div>
          </div>
        )}

        {/* Users Management Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
                <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
              </div>
              <button
                onClick={() => setShowUserForm(true)}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <span className="text-xl">➕</span>
                <span>Create New User</span>
              </button>
            </div>

            {showUserForm && (
              <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Create New User</h3>
                    <p className="text-gray-600 mt-1">Add a new user to the system</p>
                  </div>
                  <button
                    onClick={() => setShowUserForm(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg">
                  <UserCreationForm onSuccess={handleUserCreated} />
                </div>
              </div>
            )}

            <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
              <UserManagement />
            </div>
          </div>
        )}

        {/* Roles Management Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Role Management</h2>
                <p className="text-gray-600 mt-1">Define user roles and permissions</p>
              </div>
              <button
                onClick={() => setShowRoleForm(true)}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-lg flex items-center space-x-2"
              >
                <span className="text-xl">🔐</span>
                <span>Create New Role</span>
              </button>
            </div>

            {showRoleForm && (
              <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Create New Role</h3>
                    <p className="text-gray-600 mt-1">Define permissions for a new role</p>
                  </div>
                  <button
                    onClick={() => setShowRoleForm(false)}
                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg">
                  <RoleCreationForm onSuccess={handleRoleCreated} />
                </div>
              </div>
            )}

            <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
              <RoleManagement />
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Financial Analytics</h2>
              <p className="text-gray-600 mt-1">Comprehensive financial insights and performance metrics</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-green-100 to-green-200 rounded-lg p-4">
                    <span className="text-3xl">💰</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Income</p>
                    <p className="text-3xl font-bold text-green-600">
                      ₹{monthlySummary?.totalIncome?.toLocaleString('en-IN') || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-red-100 to-red-200 rounded-lg p-4">
                    <span className="text-3xl">💸</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                    <p className="text-3xl font-bold text-red-600">
                      ₹{monthlySummary?.totalExpense?.toLocaleString('en-IN') || '0'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg p-4">
                    <span className="text-3xl">📊</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Net Balance</p>
                    <p className={`text-3xl font-bold ${currentSavings >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      ₹{Math.abs((monthlySummary?.totalIncome || 0) - (monthlySummary?.totalExpense || 0)).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-xl rounded-lg p-6 border border-gray-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg p-4">
                    <span className="text-3xl">📝</span>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Records</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {monthlySummary?.totalRecords || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SavingsGoalChart
                current={currentSavings}
                goal={savingsGoal}
                month={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              />

              {primaryBudgetCategory && (
                <BudgetTracker
                  budget={primaryBudgetCategory.budget}
                  spent={primaryBudgetCategory.spent}
                  category={primaryBudgetCategory.category}
                />
              )}
            </div>

            {/* Suggestions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FinancialSuggestions
                data={{
                  totalIncome: monthlySummary?.totalIncome || 0,
                  totalExpense: monthlySummary?.totalExpense || 0,
                  topExpenseCategories
                }}
                userRole={roleName}
              />

              <BudgetRecommendations
                monthlyData={trendData.slice(0, 6)}
                userRole={roleName}
              />
            </div>
          </div>
        )}

        {/* User Analysis Tab */}
        {activeTab === 'userAnalysis' && (
          <UserAnalysis userRole="Admin" />
        )}

        {/* System Health Tab */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">System Health</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Database Status</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Connection</span>
                    <span className={`font-medium ${systemHealth?.database?.connected ? 'text-green-600' : 'text-red-600'}`}>
                      {systemHealth?.database?.connected ? 'Connected' : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Records</span>
                    <span className="text-gray-900 font-medium">{systemHealth?.database?.totalRecords ?? stats.totalRecords}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Backup</span>
                    <span className="text-gray-900 font-medium">{formatDateTime(systemHealth?.database?.lastBackupAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">DB Ping</span>
                    <span className="text-gray-900 font-medium">{systemHealth?.database?.databasePingMs ?? 0} ms</span>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">User Activity</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Users</span>
                    <span className="text-gray-900 font-medium">{systemHealth?.users?.totalUsers ?? stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Active Accounts</span>
                    <span className="text-green-600 font-medium">{systemHealth?.users?.activeUsers ?? stats.activeUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Signed In Today</span>
                    <span className="text-blue-600 font-medium">{systemHealth?.users?.activeToday ?? 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">New This Week</span>
                    <span className="text-blue-600 font-medium">{systemHealth?.users?.newUsersThisWeek ?? 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">API Status</span>
                    <span className="text-green-600 font-medium">{systemHealth?.performance?.apiStatus || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Time</span>
                    <span className="text-yellow-600 font-medium">{systemHealth?.performance?.responseTimeMs ?? 0} ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Memory Usage</span>
                    <span className="text-green-600 font-medium">{systemHealth?.performance?.memoryUsageMb ?? 0} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heap Used</span>
                    <span className="text-green-600 font-medium">{systemHealth?.performance?.heapUsagePercent ?? 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Uptime</span>
                    <span className="text-gray-900 font-medium">{formatUptime(systemHealth?.performance?.uptimeSeconds)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Role-based Dashboard for non-Admin users
  const getRoleSpecificContent = () => {
    if (hasRole('Finance Manager')) {
      return {
        title: 'Finance Manager Dashboard',
        subtitle: 'Financial oversight and team management',
        tabs: [
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'records', label: 'Records', icon: '📝' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'suggestions', label: 'Insights', icon: '💡' },
          { id: 'requests', label: 'Requests', icon: '📋' },
          { id: 'team', label: 'Team', icon: '👥' }
        ],
        quickActions: [
          { id: 'records', label: 'Add Record', icon: '➕', color: 'blue' },
          { id: 'analytics', label: 'View Reports', icon: '📈', color: 'green' },
          { id: 'requests', label: 'Review Requests', icon: '📋', color: 'purple' },
          { id: 'export', label: 'Export Data', icon: '📊', color: 'yellow' }
        ],
        features: [
          'View all project financial data',
          'Approve/deny edit and delete requests',
          'Manage team financial permissions',
          'Generate comprehensive reports',
          'Team analytics and insights',
          'Export team financial data',
          'Budget oversight and management'
        ]
      };
    } else if (hasRole('Analyst')) {
      return {
        title: 'Financial Analyst Dashboard',
        subtitle: 'Data analysis and financial insights',
        tabs: [
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'records', label: 'Records', icon: '📝' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'suggestions', label: 'Insights', icon: '💡' },
          { id: 'reports', label: 'Reports', icon: '📑' },
          { id: 'trends', label: 'Trends', icon: '📈' },
          { id: 'userAnalysis', label: 'User Analysis', icon: '👤' }
        ],
        quickActions: [
          { id: 'records', label: 'Add Record', icon: '➕', color: 'blue' },
          { id: 'reports', label: 'Generate Report', icon: '📈', color: 'green' },
          { id: 'suggestions', label: 'Get Insights', icon: '💡', color: 'purple' }
        ],
        features: [
          'View all project financial data',
          'Advanced data analysis tools',
          'AI-powered financial insights',
          'Trend analysis and forecasting',
          'Custom report generation',
          'Data visualization tools',
          'User-wise financial analysis',
          'Export analytical reports',
          'Read-only access to records'
        ]
      };
    } else if (hasRole('Employee')) {
      return {
        title: 'Employee Dashboard',
        subtitle: 'Personal finance management with team insights',
        tabs: [
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'records', label: 'Records', icon: '📝' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'suggestions', label: 'Insights', icon: '💡' },
          { id: 'budget', label: 'Budget', icon: '💰' }
        ],
        quickActions: [
          { id: 'records', label: 'Add Record', icon: '➕', color: 'blue' },
          { id: 'suggestions', label: 'Get Tips', icon: '💡', color: 'green' },
          { id: 'export', label: 'Export Data', icon: '📊', color: 'yellow' }
        ],
        features: [
          'View personal financial data only',
          'Create and edit own records',
          'Personal analytics and reports',
          'Budget management tools',
          'Financial tips and suggestions',
          'Export personal data',
          'Permission-based access control'
        ]
      };
    } else if (hasRole('Viewer')) {
      return {
        title: 'Viewer Dashboard',
        subtitle: 'Read-only access to personal financial information',
        tabs: [
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'reports', label: 'Reports', icon: '📑' }
        ],
        quickActions: [
          { id: 'analytics', label: 'View Reports', icon: '📈', color: 'blue' },
          { id: 'export', label: 'Export Data', icon: '📊', color: 'green' }
        ],
        features: [
          'View personal financial data only',
          'Read-only analytics access',
          'Export personal reports',
          'Monitor financial trends',
          'Access personal dashboards',
          'Finance record viewing',
          'Permission-based access control'
        ]
      };
    } else {
      // Default for User role
      return {
        title: 'Financial Dashboard',
        subtitle: 'Your complete financial overview with insights and recommendations',
        tabs: [
          { id: 'overview', label: 'Overview', icon: '📊' },
          { id: 'records', label: 'Records', icon: '📝' },
          { id: 'analytics', label: 'Analytics', icon: '📈' },
          { id: 'suggestions', label: 'Insights', icon: '💡' }
        ],
        quickActions: [
          { id: 'records', label: 'Add Record', icon: '➕', color: 'blue' },
          { id: 'analytics', label: 'View Reports', icon: '📈', color: 'green' },
          { id: 'suggestions', label: 'Get Insights', icon: '💡', color: 'purple' },
          { id: 'export', label: 'Export Data', icon: '📊', color: 'yellow' }
        ],
        features: [
          'View personal financial data only',
          'Create and edit own records',
          'Personal analytics and reports',
          'Export capabilities',
          'Financial insights',
          'Finance record management',
          'Permission-based access control'
        ]
      };
    }
  };

  const roleContent = getRoleSpecificContent();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {roleContent.title} - {user?.name}
        </h1>
        <p className="mt-2 text-gray-600">
          {roleContent.subtitle}
        </p>
      </div>

      {/* User Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {roleContent.tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Data Scope Indicator */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <span className="text-blue-600 font-medium">
                {(['Admin', 'Finance Manager', 'Analyst'].includes(user?.role?.name)
                  ? '🌐 Showing all project data'
                  : '👤 Showing your personal data only')}
              </span>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                  <span className="text-2xl">💰</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Income</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{monthlySummary?.totalIncome?.toLocaleString('en-IN') || '0'}
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
                    ₹{monthlySummary?.totalExpense?.toLocaleString('en-IN') || '0'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Net Balance</p>
                  <p className={`text-2xl font-bold ${currentSavings >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    ₹{Math.abs((monthlySummary?.totalIncome || 0) - (monthlySummary?.totalExpense || 0)).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-100 rounded-lg p-3">
                  <span className="text-2xl">📝</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Records</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {monthlySummary?.totalRecords || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Your Capabilities</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {roleContent.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <span className="text-green-500 text-xl">✓</span>
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {roleContent.quickActions.map(action => (
                <button
                  key={action.id}
                  onClick={() => setActiveTab(action.id)}
                  className={`${quickActionClasses[action.color] || quickActionClasses.blue} text-white px-4 py-3 rounded-lg transition-colors`}
                >
                  <span className="text-xl mb-2 block">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Records Tab */}
      {activeTab === 'records' && (
        <Records />
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Financial Analytics</h2>
            <button
              onClick={() => {
                // Export analytics data
                const analyticsData = {
                  monthlySummary,
                  categorySummary,
                  trends: trendData,
                  exportDate: new Date().toISOString(),
                  exportedBy: user?.name
                };

                const dataStr = JSON.stringify(analyticsData, null, 2);
                const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

                const exportFileDefaultName = `analytics-export-${new Date().toISOString().split('T')[0]}.json`;

                const linkElement = document.createElement('a');
                linkElement.setAttribute('href', dataUri);
                linkElement.setAttribute('download', exportFileDefaultName);
                linkElement.click();
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <span>📊</span>
              <span>Export Analytics Data</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyTrendChart
              data={trendData.slice(0, 6)}
            />

            <CategoryPieChart
              data={expenseChartData}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SavingsGoalChart
              current={currentSavings}
              goal={savingsGoal}
              month={new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            />

            {primaryBudgetCategory && (
              <BudgetTracker
                budget={primaryBudgetCategory.budget}
                spent={primaryBudgetCategory.spent}
                category={primaryBudgetCategory.category}
              />
            )}
          </div>
        </div>
      )}

      {/* Reports Tab */}
      {activeTab === 'reports' && (
        <Reports userRole={roleName} />
      )}

      {/* Trends Tab */}
      {activeTab === 'trends' && (
        <Trends userRole={roleName} />
      )}

      {/* User Analysis Tab */}
      {activeTab === 'userAnalysis' && (
        <UserAnalysis userRole={roleName} />
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-gray-900">Financial Insights & Suggestions</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FinancialSuggestions
              data={{
                totalIncome: monthlySummary?.totalIncome || 0,
                totalExpense: monthlySummary?.totalExpense || 0,
                topExpenseCategories
              }}
              userRole={roleName}
            />

            <BudgetRecommendations
              monthlyData={trendData.slice(0, 6)}
              userRole={roleName}
            />
          </div>
        </div>
      )}

      {/* Requests Tab - Only for Finance Manager */}
      {activeTab === 'requests' && hasRole('Finance Manager') && (
        <Requests embedded />
      )}
    </div>
  );
};

export default Dashboard;
