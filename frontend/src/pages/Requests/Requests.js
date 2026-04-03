import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import requestAPI from '../../services/requestAPI';
import userAPI from '../../services/userAPI';

const currency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(Number(value || 0));

const formatValue = (field, value) => {
  if (value === undefined || value === null || value === '') {
    return '-';
  }
  if (field === 'amount') {
    return currency(value);
  }
  if (field === 'date') {
    return new Date(value).toLocaleDateString();
  }
  return String(value);
};

const labelForField = (field) => {
  const labels = {
    amount: 'Amount',
    type: 'Type',
    category: 'Category',
    date: 'Date',
    notes: 'Description'
  };
  return labels[field] || field;
};

const Requests = ({ embedded = false }) => {
  const { user } = useAuth();
  const permissions = user?.permissions || {};
  const canApprove = Boolean(permissions.canApproveRequests);

  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState(canApprove ? 'pending' : 'all');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  const [actionNotes, setActionNotes] = useState('');

  const closeDetails = useCallback(() => {
    setSelectedRequest(null);
    setActionNotes('');
  }, []);

  useEffect(() => {
    if (!selectedRequest) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDetails();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRequest, closeDetails]);

  const filteredUsers = users.filter((account) => {
    const text = `${account.name} ${account.email}`.toLowerCase();
    return text.includes(userSearch.trim().toLowerCase());
  });

  const clearFeedback = () => {
    setError('');
    setSuccess('');
  };

  const fetchUsers = useCallback(async () => {
    if (!canApprove) {
      return;
    }

    try {
      const response = await userAPI.getUsers({ page: 1, limit: 1000 });
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (fetchError) {
      console.error('Failed to fetch users for requests:', fetchError);
    }
  }, [canApprove]);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        status: activeTab === 'all' ? '' : activeTab,
        type: filters.type,
        search: filters.search
      };

      if (canApprove && selectedUser) {
        params.userId = selectedUser;
      }

      const response = canApprove
        ? await requestAPI.getPendingRequests(params)
        : await requestAPI.getUserRequests(params);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch requests');
      }

      setRequests(response.data.requests || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.max(response.data.totalPages || 1, 1)
      }));
    } catch (fetchError) {
      console.error('Failed to fetch requests:', fetchError);
      setError(fetchError.message || 'Failed to fetch requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, canApprove, filters, pagination.page, pagination.limit, selectedUser]);

  useEffect(() => {
    setActiveTab(canApprove ? 'pending' : 'all');
  }, [canApprove]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const processRequest = async (action) => {
    if (!selectedRequest) {
      return;
    }

    try {
      setProcessing(true);
      clearFeedback();

      const response = action === 'approve'
        ? await requestAPI.approveRequest(selectedRequest.id, actionNotes)
        : await requestAPI.rejectRequest(selectedRequest.id, actionNotes);

      if (!response.success) {
        throw new Error(response.message || `Failed to ${action} request`);
      }

      setSuccess(response.message || `Request ${action}d successfully.`);
      setSelectedRequest(null);
      setActionNotes('');
      await fetchRequests();
    } catch (processError) {
      console.error('Request processing failed:', processError);
      setError(processError.message || `Failed to ${action} request`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const requestTabs = canApprove
    ? ['pending', 'approved', 'rejected', 'all']
    : ['all', 'pending', 'approved', 'rejected'];

  const renderChanges = (request) => {
    const entries = Object.entries(request.requestedChanges || {});

    if (request.type === 'delete') {
      return (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-900">
          The requester wants this record removed from the system.
        </div>
      );
    }

    if (entries.length === 0) {
      return (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
          No structured field changes were attached to this request.
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {entries.map(([field, nextValue]) => (
          <div key={field} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="text-sm font-medium text-gray-900">{labelForField(field)}</div>
            <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Current</div>
                <div className="mt-1 text-sm text-gray-800">
                  {formatValue(field, request.record?.[field])}
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Requested</div>
                <div className="mt-1 text-sm font-medium text-blue-700">
                  {formatValue(field, nextValue)}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={embedded ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'}>
      <div>
        {!embedded && (
          <h1 className="text-3xl font-bold text-gray-900">
            {canApprove ? 'Approval Requests' : 'My Requests'}
          </h1>
        )}
        <p className={`${embedded ? '' : 'mt-2 '}text-gray-600`}>
          {canApprove
            ? 'Search by user, review detailed requests, and approve or reject with clear notes.'
            : 'Track the status of your edit and delete requests.'}
        </p>
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{success}</div>}

      <div className="rounded-lg bg-white p-6 shadow-xl space-y-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-6">
            {requestTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveTab(tab);
                  setPagination((prev) => ({ ...prev, page: 1 }));
                }}
                className={`border-b-2 px-1 py-3 text-sm font-medium capitalize ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className={canApprove ? 'md:col-span-2' : 'md:col-span-3'}>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => handleFilterChange('search', event.target.value)}
              placeholder={canApprove ? 'Search reason, category, or requester' : 'Search reason or category'}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={filters.type}
              onChange={(event) => handleFilterChange('type', event.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="edit">Edit</option>
              <option value="delete">Delete</option>
            </select>
          </div>

          {canApprove && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Search User</label>
              <input
                type="text"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Type a user name or email"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {canApprove && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Filter By User</label>
            <select
              value={selectedUser}
              onChange={(event) => {
                setSelectedUser(event.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Users</option>
              {filteredUsers.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.email})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {canApprove && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Record</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={canApprove ? 7 : 6} className="px-6 py-12 text-center text-gray-500">Loading requests...</td>
                  </tr>
                ) : requests.length === 0 ? (
                  <tr>
                    <td colSpan={canApprove ? 7 : 6} className="px-6 py-12 text-center text-gray-500">No requests found.</td>
                  </tr>
                ) : requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    {canApprove && (
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="font-medium">{request.user?.name || request.userName || 'Unknown User'}</div>
                        <div className="text-gray-500">{request.user?.email || request.userEmail || '-'}</div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-medium">{request.record?.category || 'Unknown Category'}</div>
                      <div className="text-gray-500">
                        {request.record ? `${currency(request.record.amount)} on ${new Date(request.record.date).toLocaleDateString()}` : 'No record snapshot available'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 capitalize">{request.type}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(request.status)}`}>
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-sm whitespace-pre-wrap break-words">{request.description || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRequest(request);
                            setActionNotes('');
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          View
                        </button>
                        {canApprove && request.status === 'pending' && (
                          <>
                            <button type="button" onClick={() => { setSelectedRequest(request); setActionNotes(''); }} className="text-green-600 hover:text-green-800">
                              Review
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} requests
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page <= 1} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50">Previous</button>
                <button type="button" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page >= pagination.totalPages} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 px-4 py-6"
          onClick={closeDetails}
        >
          <div className="flex min-h-full items-center justify-center">
            <div
              className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex max-h-[calc(100vh-3rem)] flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-gray-200 px-6 py-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">Request Details</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      Review the requester details, instructions, and the exact changes they want.
                    </p>
                  </div>
                  <button type="button" onClick={closeDetails} className="text-gray-400 hover:text-gray-600">Close</button>
                </div>

                <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Requester</div>
                      <div className="mt-2 text-sm font-medium text-gray-900">
                        {selectedRequest.user?.name || selectedRequest.userName || user?.name || 'Unknown User'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedRequest.user?.email || selectedRequest.userEmail || user?.email || '-'}
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-xs uppercase tracking-wide text-gray-500">Status</div>
                      <div className="mt-2">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(selectedRequest.status)}`}>
                          {selectedRequest.status}
                        </span>
                      </div>
                      <div className="mt-3 text-sm text-gray-600">
                        Submitted on {new Date(selectedRequest.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="text-sm font-medium text-blue-900">Detailed Instruction From Requester</div>
                    <div className="mt-2 whitespace-pre-wrap text-sm text-blue-900">
                      {selectedRequest.description || 'No detailed instruction was provided.'}
                    </div>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="text-sm font-medium text-gray-900">Current Record Snapshot</div>
                    {selectedRequest.record ? (
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 text-sm text-gray-700">
                        <div><strong>Category:</strong> {selectedRequest.record.category}</div>
                        <div><strong>Type:</strong> {selectedRequest.record.type}</div>
                        <div><strong>Amount:</strong> {currency(selectedRequest.record.amount)}</div>
                        <div><strong>Date:</strong> {new Date(selectedRequest.record.date).toLocaleDateString()}</div>
                        <div className="md:col-span-2 whitespace-pre-wrap"><strong>Description:</strong> {selectedRequest.record.notes || '-'}</div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-gray-600">No current record snapshot available.</div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Requested Changes</h3>
                    <div className="mt-3">{renderChanges(selectedRequest)}</div>
                  </div>

                  {selectedRequest.admin_notes && (
                    <div className="rounded-lg bg-gray-50 p-4">
                      <div className="text-sm font-medium text-gray-900">Existing Admin Notes</div>
                      <div className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{selectedRequest.admin_notes}</div>
                    </div>
                  )}

                  {canApprove && selectedRequest.status === 'pending' && (
                    <div className="rounded-lg border border-gray-200 p-4">
                      <label className="block text-sm font-medium text-gray-700">Approval Notes</label>
                      <textarea
                        rows={4}
                        value={actionNotes}
                        onChange={(event) => setActionNotes(event.target.value)}
                        className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Add decision notes or reviewer comments"
                      />
                      <div className="mt-4 flex gap-3">
                        <button type="button" onClick={() => processRequest('approve')} disabled={processing} className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">
                          {processing ? 'Processing...' : 'Approve'}
                        </button>
                        <button type="button" onClick={() => processRequest('reject')} disabled={processing} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                          {processing ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 justify-end border-t border-gray-200 px-6 py-4">
                  <button
                    type="button"
                    onClick={closeDetails}
                    className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;
