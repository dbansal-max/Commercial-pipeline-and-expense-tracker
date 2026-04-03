import api from './api';

const unwrap = (response) => response.data;

const normalizeUser = (user) => {
  if (!user) {
    return user;
  }

  return {
    ...user,
    role: user.role?.name || user.role,
    role_id: user.role_id || user.role?.id || user.roleId || '',
    preferences: user.preferences || {
      emailNotifications: true,
      smsNotifications: false,
      dashboardTheme: 'light',
      currency: 'INR',
      dateFormat: 'DD/MM/YYYY',
      language: 'en'
    }
  };
};

export const userAPI = {
  async getProfile() {
    const response = await api.get('/auth/profile');
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: normalizeUser(payload.data?.user)
    };
  },

  async updateProfile(formData) {
    const profilePayload = formData instanceof FormData
      ? {
        name: formData.get('name') || '',
        phone: formData.get('phone') || '',
        address: formData.get('address') || '',
        bio: formData.get('bio') || '',
        profileImg: formData.get('profile_img') || null
      }
      : formData;

    const response = await api.put('/users/profile/update', profilePayload);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: normalizeUser(payload.data?.user)
    };
  },

  async changePassword(passwordData) {
    const response = await api.put('/users/change-password', passwordData);
    return unwrap(response);
  },

  async updatePreferences(preferences) {
    const response = await api.put('/users/preferences', preferences);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data
    };
  },

  async getMyActivity() {
    const response = await api.get('/users/me/activity');
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data || []
    };
  },

  async getUsers(params) {
    const response = await api.get('/users', { params });
    const payload = unwrap(response);
    const pagination = payload.data?.pagination || {};
    const users = (payload.data?.users || []).map(normalizeUser);

    return {
      success: payload.success,
      message: payload.message,
      data: {
        users,
        total: pagination.total || 0,
        page: pagination.page || 1,
        limit: pagination.limit || params?.limit || 10,
        totalPages: pagination.totalPages || 0
      }
    };
  },

  async getBasicUsers(params) {
    const response = await api.get('/users/basic', { params });
    const payload = unwrap(response);
    const users = (payload.data?.users || []).map(normalizeUser);

    return {
      success: payload.success,
      message: payload.message,
      data: {
        users
      }
    };
  },

  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: {
        user: normalizeUser(payload.data?.user),
        summary: payload.data?.summary
      }
    };
  },

  async createUser(userData) {
    const response = await api.post('/auth/admin-register', {
      name: userData.name,
      email: userData.email,
      password: userData.password || 'Password@123',
      roleName: userData.roleName || userData.role || userData.role_name || userData.roleName || ''
    });
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: normalizeUser(payload.data?.user)
    };
  },

  async updateUser(id, userData) {
    const payloadData = {
      name: userData.name,
      email: userData.email,
      status: userData.status,
      roleId: userData.roleId || userData.role_id || ''
    };

    const response = await api.put(`/users/${id}`, payloadData);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: normalizeUser(payload.data?.user)
    };
  },

  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`);
    return unwrap(response);
  },

  async getAdminStats() {
    const response = await api.get('/users/stats');
    return unwrap(response);
  },

  async updateUserStatus(id, status) {
    const response = await api.patch(`/users/${id}/status`, { status });
    return unwrap(response);
  },

  async changePassword(currentPassword, newPassword) {
    const response = await api.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
    return unwrap(response);
  }
};

export default userAPI;
