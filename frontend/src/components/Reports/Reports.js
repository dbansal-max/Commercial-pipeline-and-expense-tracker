import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../../services/api';

const Reports = ({ userRole = 'Analyst' }) => {
  const [reports, setReports] = useState([]);
  const [userReports, setUserReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedUser, setSelectedUser] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    fetchReports();
    if (userRole === 'Admin' || userRole === 'Analyst') {
      fetchUserReports();
    }
  }, [selectedPeriod, selectedUser, userRole]);

  // Debounced search for users
  useEffect(() => {
    if (userRole === 'Admin' || userRole === 'Analyst') {
      const timeoutId = setTimeout(() => {
        fetchUserReports(userSearch);
      }, 300); // 300ms debounce

      return () => clearTimeout(timeoutId);
    }
  }, [userSearch, userRole]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getReports?.({
        period: selectedPeriod,
        userId: selectedUser
      }) || { data: { data: [] } };

      setReports(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      setError('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserReports = async (searchTerm = '') => {
    try {
      setUserLoading(true);
      console.log('🔍 Fetching user reports with search:', searchTerm);

      const response = await dashboardAPI.getUserReports?.({
        search: searchTerm,
        sortBy: 'name',
        sortOrder: 'asc'
      }) || { data: { data: [] } };

      console.log('📊 User reports response:', response);

      // Handle 403 Forbidden error for non-authorized users
      if (response.response?.status === 403) {
        console.warn('User does not have permission to access user list');
        setUserReports([]);
        return;
      }

      setUserReports(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error('❌ Failed to fetch user reports:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);

      // Don't show error for permission issues, just empty the list
      if (error.response?.status !== 403) {
        setUserReports([]);
      }
    } finally {
      setUserLoading(false);
    }
  };

  const generateReport = async (type) => {
    try {
      const response = await dashboardAPI.generateReport?.({
        type,
        period: selectedPeriod,
        userId: selectedUser
      });

      if (response.data?.success) {
        // Add the new report to the existing reports list
        const newReport = response.data.data;
        setReports(prevReports => [...prevReports, newReport]);
      }
    } catch (error) {
      setError('Failed to generate report');
    }
  };

  const downloadReport = (reportId, format = 'json') => {
    // Find the report data
    const reportData = reports.find(r => r.id === reportId);
    if (!reportData) return;

    if (format === 'excel') {
      downloadExcelReport(reportData);
    } else if (format === 'pdf') {
      downloadPDFReport(reportData);
    } else {
      downloadJSONReport(reportData);
    }
  };

  const downloadJSONReport = (reportData) => {
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `report-${reportData.id}-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const downloadExcelReport = (reportData) => {
    // Create Excel-compatible CSV data
    let csvContent = '';

    if (reportData.type === 'summary') {
      csvContent = 'Report Type,Period,User,Total Income,Total Expenses,Net Balance,Savings Rate,Total Records,Top Category,Avg Monthly Income,Avg Monthly Expenses\n';
      csvContent += `Summary,${reportData.period},${reportData.user},${reportData.summary?.totalIncome || 0},${reportData.summary?.totalExpenses || 0},${reportData.summary?.netBalance || 0},${reportData.summary?.savingsRate || 0}%,${reportData.summary?.totalRecords || 0},${reportData.summary?.topExpenseCategory || 'N/A'},${reportData.summary?.averageMonthlyIncome || 0},${reportData.summary?.averageMonthlyExpenses || 0}\n`;
    } else if (reportData.type === 'detailed') {
      csvContent = 'Report Type,Period,User,Income Category,Income Amount,Income %,Expense Category,Expense Amount,Expense %,Income Growth,Expense Growth,Savings Growth\n';
      reportData.details?.incomeBreakdown?.forEach(income => {
        csvContent += `Detailed,${reportData.period},${reportData.user},${income.category},${income.amount},${income.percentage}%,,,,,,\n`;
      });
      reportData.details?.expenseBreakdown?.forEach(expense => {
        csvContent += `Detailed,${reportData.period},${reportData.user},,,${expense.category},${expense.amount},${expense.percentage}%,\n`;
      });
    } else if (reportData.type === 'trends') {
      csvContent = 'Report Type,Period,User,Month,Income,Expenses,Savings,Insights\n';
      reportData.trends?.monthlyData?.forEach(month => {
        csvContent += `Trends,${reportData.period},${reportData.user},${month.month},${month.income},${month.expenses},${month.savings},"${reportData.trends?.insights?.join('; ') || ''}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `report-${reportData.id}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDFReport = (reportData) => {
    // Create a simple HTML structure for PDF generation
    let htmlContent = `
      <html>
        <head>
          <title>${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #333; margin-top: 20px; }
            table { border-collapse: collapse; width: 100%; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .summary { background-color: #e8f5e8; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .insights { background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>${reportData.type.charAt(0).toUpperCase() + reportData.type.slice(1)} Report</h1>
          <p><strong>Period:</strong> ${reportData.period} | <strong>User:</strong> ${reportData.user} | <strong>Generated:</strong> ${new Date(reportData.generatedAt).toLocaleString()}</p>
    `;

    if (reportData.type === 'summary' && reportData.summary) {
      htmlContent += `
          <div class="summary">
            <h2>Financial Summary</h2>
            <table>
              <tr><th>Metric</th><th>Amount</th></tr>
              <tr><td>Total Income</td><td>₹${(reportData.summary.totalIncome || 0).toLocaleString('en-IN')}</td></tr>
              <tr><td>Total Expenses</td><td>₹${(reportData.summary.totalExpenses || 0).toLocaleString('en-IN')}</td></tr>
              <tr><td>Net Balance</td><td>₹${(reportData.summary.netBalance || 0).toLocaleString('en-IN')}</td></tr>
              <tr><td>Savings Rate</td><td>${reportData.summary.savingsRate || 0}%</td></tr>
              <tr><td>Total Records</td><td>${reportData.summary.totalRecords || 0}</td></tr>
              <tr><td>Top Expense Category</td><td>${reportData.summary.topExpenseCategory || 'N/A'}</td></tr>
            </table>
          </div>
      `;
    } else if (reportData.type === 'detailed' && reportData.details) {
      htmlContent += `
          <div class="summary">
            <h2>Income Breakdown</h2>
            <table>
              <tr><th>Category</th><th>Amount</th><th>Percentage</th></tr>
              ${reportData.details.incomeBreakdown?.map(inc =>
        `<tr><td>${inc.category}</td><td>₹${inc.amount.toLocaleString('en-IN')}</td><td>${inc.percentage}%</td></tr>`
      ).join('') || ''}
            </table>
          </div>
          <div class="summary">
            <h2>Expense Breakdown</h2>
            <table>
              <tr><th>Category</th><th>Amount</th><th>Percentage</th></tr>
              ${reportData.details.expenseBreakdown?.map(exp =>
        `<tr><td>${exp.category}</td><td>₹${exp.amount.toLocaleString('en-IN')}</td><td>${exp.percentage}%</td></tr>`
      ).join('') || ''}
            </table>
          </div>
      `;
    } else if (reportData.type === 'trends' && reportData.trends) {
      htmlContent += `
          <div class="summary">
            <h2>Monthly Trends</h2>
            <table>
              <tr><th>Month</th><th>Income</th><th>Expenses</th><th>Savings</th></tr>
              ${reportData.trends.monthlyData?.map(month =>
        `<tr><td>${month.month}</td><td>₹${month.income.toLocaleString('en-IN')}</td><td>₹${month.expenses.toLocaleString('en-IN')}</td><td>₹${month.savings.toLocaleString('en-IN')}</td></tr>`
      ).join('') || ''}
            </table>
          </div>
          <div class="insights">
            <h2>Key Insights</h2>
            <ul>
              ${reportData.trends.insights?.map(insight => `<li>${insight}</li>`).join('') || ''}
            </ul>
          </div>
      `;
    }

    htmlContent += `
        </body>
      </html>
    `;

    // Create a temporary window and trigger print dialog
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
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
          <h2 className="text-2xl font-bold text-gray-900">Financial Reports</h2>
          <p className="text-gray-600 mt-1">Generate and download comprehensive financial reports</p>
        </div>
        <div className="flex space-x-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          {(userRole === 'Admin' || userRole === 'Analyst') && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
              {userLoading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              {userSearch && (
                <button
                  onClick={() => setUserSearch('')}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {(userRole === 'Admin' || userRole === 'Analyst') && (
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Users</option>
              {userReports.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Report Generation */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate New Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => generateReport('summary')}
            className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="text-xl mb-2 block">📊</span>
            Summary Report
          </button>
          <button
            onClick={() => generateReport('detailed')}
            className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            <span className="text-xl mb-2 block">📈</span>
            Detailed Analysis
          </button>
          <button
            onClick={() => generateReport('trends')}
            className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <span className="text-xl mb-2 block">📉</span>
            Trends Report
          </button>
        </div>
      </div>

      {/* Reports List */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Generated Reports</h3>
        </div>
        <div className="overflow-hidden">
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">📑</span>
              <p className="text-gray-500">No reports generated yet</p>
              <p className="text-gray-400 text-sm mt-1">Generate your first report using the options above</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Report Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">
                            {report.type === 'summary' ? '📊' :
                              report.type === 'detailed' ? '📈' : '📉'}
                          </span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {report.type.charAt(0).toUpperCase() + report.type.slice(1)} Report
                            </div>
                            <div className="text-sm text-gray-500">
                              {report.user} • {report.period}
                            </div>
                            {report.type === 'summary' && report.summary && (
                              <div className="text-xs text-green-600 mt-1">
                                Net: ₹{(report.summary.netBalance || 0).toLocaleString('en-IN')}
                                ({(report.summary.savingsRate || 0).toFixed(1)}% savings)
                              </div>
                            )}
                            {report.type === 'detailed' && report.details && (
                              <div className="text-xs text-blue-600 mt-1">
                                Income: ₹{(report.details.incomeBreakdown?.reduce((sum, cat) => sum + cat.amount, 0) || 0).toLocaleString('en-IN')}
                              </div>
                            )}
                            {report.type === 'trends' && report.trends && (
                              <div className="text-xs text-purple-600 mt-1">
                                {report.trends.monthlyData?.length || 0} months analyzed
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.period.charAt(0).toUpperCase() + report.period.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {report.user}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${report.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                          }`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => downloadReport(report.id, 'pdf')}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                            title="Download as PDF"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2v-7a2 2 0 00-2-2H9a2 2 0 00-2 2v7a2 2 0 002 2h10a2 2 0 002-2v-7a2 2 0 00-2-2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h6l-3 3H3v4l3 3z" />
                            </svg>
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => downloadReport(report.id, 'excel')}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                            title="Download as Excel"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l-4-4h2l-4 4h2l4 4z" />
                            </svg>
                            <span>Excel</span>
                          </button>
                          <button
                            onClick={() => downloadReport(report.id, 'json')}
                            className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            title="Download as JSON"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h6l-3 3H3v4l3 3z" />
                            </svg>
                            <span>JSON</span>
                          </button>
                        </div>
                        <button
                          onClick={() => generateReport(report.type)}
                          className="text-gray-600 hover:text-gray-900 ml-2"
                        >
                          Regenerate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
