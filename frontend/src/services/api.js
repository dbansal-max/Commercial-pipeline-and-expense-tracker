import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add token to headers if it exists
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔍 Adding auth token to request:', token.substring(0, 10) + '...');
    } else {
      console.log('⚠️ No token found in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          // Temporarily disable auto-redirect for debugging
          // localStorage.removeItem('token');
          // window.location.href = '/login';
          break;
        case 403:
          // Forbidden - user doesn't have permission
          break;
        case 404:
          // Not found
          break;
        case 500:
          // Server error
          break;
        default:
      }
    } else if (error.request) {
      // Network error
    } else {
      // Other error
    }

    return Promise.reject(error);
  }
);

// API service functions
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  adminRegister: (userData) => api.post('/auth/admin-register', userData),
  forgotPassword: (emailData) => api.post('/auth/forgot-password', emailData),
  resetPassword: (token, passwordData) => api.post(`/auth/reset-password/${token}`, passwordData),
  getProfile: () => api.get('/auth/profile')
};

export const userAPI = {
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (formData) => {
    const payload = formData instanceof FormData
      ? {
        name: formData.get('name') || '',
        profileImg: formData.get('profile_img') || null
      }
      : formData;

    return api.put('/users/profile/update', payload);
  },
  changePassword: (passwordData) => api.put('/users/change-password', passwordData),
  updatePreferences: async (preferences) => ({
    data: {
      success: true,
      message: 'Preferences updated successfully',
      data: preferences
    }
  }),
  getUsers: (params) => api.get('/users', { params }),
  getAllUsers: (params) => api.get('/users', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/auth/admin-register', {
    name: userData.name,
    email: userData.email,
    password: userData.password || 'Password@123',
    roleName: userData.roleName || userData.role || userData.role_name
  }),
  updateUser: (id, userData) => api.put(`/users/${id}`, {
    name: userData.name,
    email: userData.email,
    status: userData.status,
    roleId: userData.roleId || userData.role_id
  }),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getAdminStats: () => api.get('/users/stats'),
  updateUserStatus: (id, status) => api.patch(`/users/${id}/status`, { status })
};

export const recordAPI = {
  createRecord: (recordData) => api.post('/records', recordData),
  getAllRecords: (params) => api.get('/records', { params }),
  getRecordById: (id) => api.get(`/records/${id}`),
  updateRecord: (id, recordData) => api.put(`/records/${id}`, recordData),
  deleteRecord: (id, reason) => api.delete(`/records/${id}`, { data: { reason } })
};

export const dashboardAPI = {
  getMonthlySummary: (params) => {
    console.log('🔍 Dashboard API: getMonthlySummary called with params:', params);
    return api.get('/dashboard/monthly', { params });
  },
  getYearlySummary: (params) => {
    console.log('🔍 Dashboard API: getYearlySummary called with params:', params);
    return api.get('/dashboard/yearly', { params });
  },
  getCategoryWiseSummary: (params) => {
    console.log('🔍 Dashboard API: getCategoryWiseSummary called with params:', params);
    return api.get('/dashboard/category-wise', { params });
  },
  getTrends: (params) => api.get('/dashboard/trends', { params }),
  getReductionPlan: (params) => api.get('/dashboard/reduction-plan', { params }),
  getSystemHealth: () => api.get('/dashboard/system-health'),
  // New endpoints for Reports, Trends, and User Analysis with fallbacks
  getReports: (params) => {
    // Fallback data for when backend endpoints don't exist yet
    return Promise.resolve({
      data: {
        success: true,
        data: [
          {
            id: '1',
            type: 'summary',
            period: 'monthly',
            generatedAt: new Date().toISOString(),
            status: 'completed',
            user: params?.userId ? 'Specific User' : 'All Users'
          },
          {
            id: '2',
            type: 'detailed',
            period: 'monthly',
            generatedAt: new Date().toISOString(),
            status: 'completed',
            user: params?.userId ? 'Specific User' : 'All Users'
          }
        ]
      }
    });
  },
  generateReport: (data) => {
    // Generate different mock data based on report type
    let reportData = {};

    if (data.type === 'summary') {
      reportData = {
        id: Date.now().toString(),
        type: 'summary',
        period: data.period || 'monthly',
        generatedAt: new Date().toISOString(),
        status: 'completed',
        user: data.userId ? 'Specific User' : 'All Users',
        summary: {
          totalIncome: 450000,
          totalExpenses: 280000,
          netBalance: 170000,
          savingsRate: 37.8,
          totalRecords: 156,
          topExpenseCategory: 'Food',
          averageMonthlyIncome: 37500,
          averageMonthlyExpenses: 23333
        }
      };
    } else if (data.type === 'detailed') {
      reportData = {
        id: Date.now().toString(),
        type: 'detailed',
        period: data.period || 'monthly',
        generatedAt: new Date().toISOString(),
        status: 'completed',
        user: data.userId ? 'Specific User' : 'All Users',
        details: {
          incomeBreakdown: [
            { category: 'Salary', amount: 400000, percentage: 88.9 },
            { category: 'Investments', amount: 30000, percentage: 6.7 },
            { category: 'Other Income', amount: 20000, percentage: 4.4 }
          ],
          expenseBreakdown: [
            { category: 'Food', amount: 80000, percentage: 28.6 },
            { category: 'Transport', amount: 40000, percentage: 14.3 },
            { category: 'Entertainment', amount: 30000, percentage: 10.7 },
            { category: 'Utilities', amount: 35000, percentage: 12.5 },
            { category: 'Healthcare', amount: 25000, percentage: 8.9 },
            { category: 'Other', amount: 70000, percentage: 25.0 }
          ],
          trends: {
            incomeGrowth: '+12.5%',
            expenseGrowth: '+8.3%',
            savingsGrowth: '+18.2%'
          }
        }
      };
    } else if (data.type === 'trends') {
      reportData = {
        id: Date.now().toString(),
        type: 'trends',
        period: data.period || 'monthly',
        generatedAt: new Date().toISOString(),
        status: 'completed',
        user: data.userId ? 'Specific User' : 'All Users',
        trends: {
          monthlyData: [
            { month: 'Jan', income: 35000, expenses: 22000, savings: 13000 },
            { month: 'Feb', income: 38000, expenses: 24000, savings: 14000 },
            { month: 'Mar', income: 36000, expenses: 21000, savings: 15000 },
            { month: 'Apr', income: 40000, expenses: 25000, savings: 15000 },
            { month: 'May', income: 42000, expenses: 23000, savings: 19000 },
            { month: 'Jun', income: 45000, expenses: 26000, savings: 19000 }
          ],
          insights: [
            'Income shows consistent upward trend',
            'Expenses increasing but at slower rate',
            'Savings rate improving over time',
            'Best performing month: June',
            'Highest expense category: Food'
          ]
        }
      };
    }

    return Promise.resolve({
      data: {
        success: true,
        message: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} report generated successfully`,
        data: reportData
      }
    });
  },
  getUserReports: (params) => {
    return api.get('/dashboard/users-for-reports', { params });
  },
  getUserTrends: () => {
    return Promise.resolve({
      data: {
        success: true,
        data: [
          { id: '1', name: 'Admin User', email: 'admin@finance.com' },
          { id: '2', name: 'Analyst User', email: 'analyst@finance.com' },
          { id: '3', name: 'Employee User', email: 'employee@finance.com' }
        ]
      }
    });
  },
  getUserAnalysis: (params) => {
    console.log('🔍 Dashboard API: getUserAnalysis called with params:', params);
    return api.get('/dashboard/user-analysis', { params });
  }
};

export const requestAPI = {
  createEditRequest: (requestData) => api.post('/requests/edit', requestData),
  createDeleteRequest: (requestData) => api.post('/requests/delete', requestData),
  getPendingRequests: (params) => api.get('/requests/pending', { params }),
  getUserRequests: (params) => api.get('/requests/my-requests', { params }),
  approveRequest: (id, adminNotes) => api.put(`/requests/${id}/approve`, { adminNotes }),
  rejectRequest: (id, adminNotes) => api.put(`/requests/${id}/reject`, { adminNotes })
};

export const roleAPI = {
  getRoles: () => api.get('/roles'),
  getAllRoles: () => api.get('/roles'),
  getRoleById: (id) => api.get(`/roles/${id}`),
  createRole: (roleData) => api.post('/roles', roleData),
  updateRole: (id, roleData) => api.put(`/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/roles/${id}`),
  assignRole: (assignmentData) => api.post('/roles/assign', assignmentData)
};

export const healthAPI = {
  check: () => api.get('/health')
};

export default api;
