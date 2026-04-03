import api from './api';

const unwrap = (response) => response.data;

const normalizeRequest = (request) => ({
  ...request,
  type: request?.type?.toLowerCase?.() || request?.type,
  status: request?.status?.toLowerCase?.() || request?.status,
  description: request?.reason || request?.description || '',
  priority: request?.priority || 'medium',
  requestedChanges: request?.requested_changes || request?.requestedChanges || {},
  userName: request?.user?.name || '',
  userEmail: request?.user?.email || '',
  recordNotes: request?.record?.notes || ''
});

export const requestAPI = {
  async createEditRequest(requestData) {
    const response = await api.post('/requests/edit', {
      recordId: requestData.recordId || requestData.record_id,
      requestedChanges: requestData.requestedChanges || requestData.requested_changes,
      reason: requestData.reason
    });

    return unwrap(response);
  },

  async createDeleteRequest(requestData) {
    const response = await api.post('/requests/delete', {
      recordId: requestData.recordId || requestData.record_id,
      reason: requestData.reason
    });

    return unwrap(response);
  },

  async getPendingRequests(params) {
    const response = await api.get('/requests/pending', { params });
    const payload = unwrap(response);
    const pagination = payload.data?.pagination || {};

    return {
      success: payload.success,
      message: payload.message,
      data: {
        requests: (payload.data?.requests || []).map(normalizeRequest),
        total: pagination.total || 0,
        page: pagination.page || params?.page || 1,
        limit: pagination.limit || params?.limit || 10,
        totalPages: pagination.totalPages || 0
      }
    };
  },

  async getUserRequests(params) {
    const response = await api.get('/requests/my-requests', { params });
    const payload = unwrap(response);
    const pagination = payload.data?.pagination || {};

    return {
      success: payload.success,
      message: payload.message,
      data: {
        requests: (payload.data?.requests || []).map(normalizeRequest),
        total: pagination.total || 0,
        page: pagination.page || params?.page || 1,
        limit: pagination.limit || params?.limit || 10,
        totalPages: pagination.totalPages || 0
      }
    };
  },

  async approveRequest(id, adminNotes) {
    const response = await api.put(`/requests/${id}/approve`, { adminNotes });
    return unwrap(response);
  },

  async rejectRequest(id, adminNotes) {
    const response = await api.put(`/requests/${id}/reject`, { adminNotes });
    return unwrap(response);
  },

  async processRequest(id, actionData) {
    if (actionData.action === 'approve') {
      return this.approveRequest(id, actionData.notes);
    }

    return this.rejectRequest(id, actionData.notes);
  }
};

export default requestAPI;
