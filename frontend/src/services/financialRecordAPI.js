import api from './api';

const unwrap = (response) => response.data;

const normalizeRecord = (record) => ({
  ...record,
  description: record?.description || record?.notes || '',
  notes: record?.notes || record?.description || ''
});

const mapRecordPayload = (recordData) => ({
  amount: recordData.amount,
  type: recordData.type,
  category: recordData.category,
  date: recordData.date,
  notes: recordData.description || recordData.notes || '',
  userId: recordData.userId || recordData.user_id || undefined,
  reason: recordData.reason || undefined
});

export const financialRecordAPI = {
  async getRecords(params) {
    console.log('🔍 financialRecordAPI.getRecords called with params:', params);
    const response = await api.get('/records', { params });
    console.log('🔍 Raw API response:', response);

    const payload = unwrap(response);
    console.log('🔍 Unwrapped payload:', payload);

    const pagination = payload.data?.pagination || {};
    console.log('🔍 Pagination data:', pagination);

    const result = {
      success: payload.success,
      message: payload.message,
      data: {
        records: (payload.data?.records || []).map(normalizeRecord),
        total: pagination.total || 0,
        page: pagination.page || 1,
        limit: pagination.limit || params?.limit || 10,
        totalPages: pagination.totalPages || 0
      }
    };

    console.log('🔍 Final result:', result);
    return result;
  },

  async getRecordById(id) {
    const response = await api.get(`/records/${id}`);
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: normalizeRecord(payload.data?.record)
    };
  },

  async createRecord(recordData) {
    const response = await api.post('/records', mapRecordPayload(recordData));
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: normalizeRecord(payload.data?.record)
    };
  },

  async updateRecord(id, recordData) {
    const response = await api.put(`/records/${id}`, mapRecordPayload(recordData));
    const payload = unwrap(response);

    return {
      success: payload.success,
      message: payload.message,
      data: normalizeRecord(payload.data?.record || payload.data?.editRequest)
    };
  },

  async deleteRecord(id, reason) {
    const response = await api.delete(`/records/${id}`, {
      data: {
        reason
      }
    });
    return unwrap(response);
  }
};

export default financialRecordAPI;
