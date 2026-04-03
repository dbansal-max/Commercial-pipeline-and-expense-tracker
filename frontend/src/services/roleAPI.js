import api from './api';

const unwrap = (response) => response.data;

export const roleAPI = {
  async getRoles() {
    const response = await api.get('/roles');
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data || []
    };
  },

  async getRoleById(id) {
    const response = await api.get(`/roles/${id}`);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data?.role
    };
  },

  async createRole(roleData) {
    const response = await api.post('/roles', roleData);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data?.role
    };
  },

  async updateRole(id, roleData) {
    const response = await api.put(`/roles/${id}`, roleData);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data?.role
    };
  },

  async deleteRole(id) {
    const response = await api.delete(`/roles/${id}`);
    return unwrap(response);
  },

  async assignRole(assignmentData) {
    const response = await api.post('/roles/assign', assignmentData);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data?.user
    };
  }
};

export default roleAPI;
