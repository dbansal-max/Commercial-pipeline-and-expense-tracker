import api from './api';

const unwrap = (response) => response.data;

export const settingsAPI = {
  async getSettings() {
    const response = await api.get('/settings');
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data
    };
  },

  async updateSettings(settingsData) {
    const response = await api.put('/settings', settingsData);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: payload.data
    };
  }
};

export default settingsAPI;
