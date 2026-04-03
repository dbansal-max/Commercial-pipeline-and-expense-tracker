import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import financialRecordAPI from '../../services/financialRecordAPI';
import userAPI from '../../services/userAPI';
import requestAPI from '../../services/requestAPI';

const categories = [
  'Salary', 'Freelance', 'Investment', 'Business', 'Rent Income', 'Interest',
  'Dividends', 'Bonus', 'Commission', 'Other Income', 'Food & Dining',
  'Transport', 'Housing', 'Utilities', 'Healthcare', 'Entertainment',
  'Shopping', 'Education', 'Insurance', 'Taxes', 'Savings', 'Groceries',
  'Fuel', 'Internet', 'Phone Bill', 'EMI', 'Loan Payment', 'Travel',
  'Gifts', 'Other Expenses'
];

const emptyForm = (currentUserId, selectedUserId = '') => ({
  type: 'Expense',
  category: 'Food & Dining',
  amount: '',
  description: '',
  date: new Date().toISOString().split('T')[0],
  userId: selectedUserId || currentUserId || ''
});

const currency = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
}).format(Number(value || 0));

const Records = ({ embedded = false, permissions = {}, userRole = '' }) => {
  const { user } = useAuth();
  const roleName = user?.role?.name || user?.role || userRole || '';
  const userPermissions = user?.permissions || permissions;

  // Dynamic role-based permissions for 4 sections
  const getPermissions = () => {
    // Section 1: Create & View Own Records (ALL ROLES - User, Viewer, Employee, Finance Manager, Analyst, Admin)
    const canCreateAndViewOwn = true;

    // Section 2: Edit/Delete Own Records (ALL ROLES can request, Admin can do directly)
    const canEditDeleteOwnWithRequest = true;

    // Section 3: View All Records (Finance Manager, Analyst, Admin only - based on database permissions)
    const canViewAllRecords = ['Finance Manager', 'Analyst', 'Admin'].includes(roleName);

    // Section 4: Manage All Records (Admin only)
    const canManageAllRecords = roleName === 'Admin';

    return {
      canCreateAndViewOwn,
      canEditDeleteOwnWithRequest,
      canViewAllRecords,
      canManageAllRecords
    };
  };

  const perms = getPermissions();

  const [activeTab, setActiveTab] = useState('own-records'); // Default to own records tab

  // Admin direct edit permission - ONLY Admin can edit/delete directly
  const canDirectEdit = roleName === 'Admin';

  const [records, setRecords] = useState([]);
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [formData, setFormData] = useState(emptyForm(user?.id));
  const [requestReason, setRequestReason] = useState('');
  const [deleteRequest, setDeleteRequest] = useState({ open: false, record: null, reason: '' });

  const filteredUsers = users.filter((account) => {
    const text = `${account.name} ${account.email}`.toLowerCase();
    return text.includes(userSearch.trim().toLowerCase());
  });

  const clearFeedback = () => {
    setError('');
    setSuccess('');
  };

  const fetchUsers = useCallback(async () => {
    // Only users who can view all records need the users list
    if (!perms.canViewAllRecords) {
      return;
    }

    try {
      const response = await userAPI.getBasicUsers({ page: 1, limit: 1000 });
      if (response.success) {
        setUsers(response.data.users || []);
      }
    } catch (fetchError) {
      console.error('Failed to fetch users:', fetchError);
      // Don't set error state for users fetch failure, just log it
      // This prevents blocking the records display
    }
  }, [perms.canViewAllRecords]);

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Starting fetchRecords with activeTab:', activeTab);
      console.log('🔍 User permissions:', perms);
      console.log('🔍 User ID:', user?.id);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: filters.search,
        type: filters.type,
        category: filters.category,
        startDate: filters.startDate,
        endDate: filters.endDate
      };

      // Determine what records to fetch based on active tab
      if (activeTab === 'own-records' || activeTab === 'edit-delete-own') {
        params.userId = user?.id;
      } else if (activeTab === 'view-all-records' || activeTab === 'manage-all-records') {
        if (selectedUser) {
          params.userId = selectedUser;
        }
        // Don't add userId filter to get all records
      }

      console.log('🔍 API params:', params);
      const response = await financialRecordAPI.getRecords(params);

      console.log('Fetch Records Response:', response);
      console.log('Active Tab:', activeTab);
      console.log('User ID:', user?.id);

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch records');
      }

      console.log('Records Data:', response.data.records);
      setRecords(response.data.records || []);
      setPagination((prev) => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: Math.max(response.data.totalPages || 1, 1)
      }));
    } catch (fetchError) {
      console.error('❌ Failed to fetch records:', fetchError);
      setError(fetchError.message || 'Failed to fetch records');
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit, selectedUser, activeTab, user?.id]);

  useEffect(() => {
    console.log('🔍 Records: Records component mounted');
    console.log('🔍 Records: User object:', user);
    console.log('🔍 Records: User role:', user?.role?.name);
    console.log('🔍 Records: Permissions:', perms);
    console.log('🔍 Records: Active tab:', activeTab);

    fetchUsers();
    if (user?.id) {
      fetchRecords();
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUsers();
  }, [perms.canViewAllRecords]);

  // Fetch records when tab changes
  useEffect(() => {
    if (user?.id) {
      console.log('🔍 Records: Active tab changed to:', activeTab);
      fetchRecords();
    }
  }, [activeTab, user?.id]);

  // Fetch records when filters or pagination change
  useEffect(() => {
    if (user?.id) {
      console.log('🔍 Records: Filters or pagination changed');
      fetchRecords();
    }
  }, [filters, pagination.page, pagination.limit, selectedUser, user?.id]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const openCreate = () => {
    clearFeedback();
    setEditingRecord(null);
    setRequestReason('');
    setFormData(emptyForm(user?.id, selectedUser));
    setShowForm(true);
  };

  const openEdit = (record) => {
    clearFeedback();

    // Check if user can edit this record
    const isOwnRecord = record.user_id === user?.id;
    const canEditThisRecord = canDirectEdit || (isOwnRecord && perms.canEditDeleteOwnWithRequest);

    if (!canEditThisRecord) {
      setError('You do not have permission to edit this record.');
      return;
    }

    setEditingRecord(record);
    setRequestReason('');
    setFormData({
      type: record.type,
      category: record.category,
      amount: String(record.amount),
      description: record.description,
      date: record.date,
      userId: record.user_id
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingRecord(null);
    setRequestReason('');
    setFormData(emptyForm(user?.id, selectedUser));
  };

  const submitDelete = async (recordId, reason = '') => {
    try {
      setSaving(true);
      clearFeedback();

      let response;
      if (canDirectEdit) {
        // Admin can delete directly
        response = await financialRecordAPI.deleteRecord(recordId, reason);
      } else {
        // Non-admin users must send delete request
        response = await requestAPI.createDeleteRequest({
          recordId: recordId,
          reason: reason
        });
      }

      if (!response.success) {
        throw new Error(response.message || 'Failed to process delete action');
      }

      setSuccess(response.message || (canDirectEdit ? 'Record deleted successfully.' : 'Delete request submitted successfully.'));
      setDeleteRequest({ open: false, record: null, reason: '' });
      await fetchRecords();
    } catch (deleteError) {
      console.error('Delete error:', deleteError);
      setError(deleteError.message || 'Failed to process delete action');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    clearFeedback();

    // Check if user can delete this record
    const isOwnRecord = record.user_id === user?.id;
    const canDeleteThisRecord = canDirectEdit || (isOwnRecord && perms.canEditDeleteOwnWithRequest);

    if (!canDeleteThisRecord) {
      setError('You do not have permission to delete this record.');
      return;
    }

    if (canDirectEdit) {
      if (window.confirm('Delete this record permanently?')) {
        await submitDelete(record.id);
      }
      return;
    }
    setDeleteRequest({ open: true, record, reason: '' });
  };

  const handleSave = async (event) => {
    event.preventDefault();
    clearFeedback();

    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Please enter a valid amount greater than zero.');
      return;
    }
    if (!editingRecord && perms.canViewAllRecords && !formData.userId) {
      setError('Please select the user for this record.');
      return;
    }
    if (editingRecord && !canDirectEdit && requestReason.trim().length < 10) {
      setError('Please explain in detail what should be changed and why.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...formData,
        amount,
        date: formData.date,
        reason: editingRecord && !canDirectEdit ? requestReason.trim() : undefined
      };

      let response;
      if (editingRecord) {
        if (canDirectEdit) {
          // Admin can edit directly
          response = await financialRecordAPI.updateRecord(editingRecord.id, payload);
        } else {
          // Non-admin users must send edit request
          response = await requestAPI.createEditRequest({
            recordId: editingRecord.id,
            requestedChanges: {
              type: payload.type,
              category: payload.category,
              amount: payload.amount,
              description: payload.description,
              date: payload.date
            },
            reason: requestReason.trim()
          });
        }
      } else {
        // Create new record
        response = await financialRecordAPI.createRecord(payload);
      }

      if (!response.success) {
        throw new Error(response.message || 'Failed to save record');
      }

      setSuccess(response.message || (editingRecord ? (canDirectEdit ? 'Record updated successfully.' : 'Edit request submitted successfully.') : 'Record created successfully.'));
      closeForm();
      await fetchRecords();
    } catch (saveError) {
      console.error('Save error:', saveError);
      setError(saveError.message || 'Failed to save record');
    } finally {
      setSaving(false);
    }
  };

  const totals = records.reduce((summary, record) => {
    const amount = Number(record.amount || 0);
    if (record.type === 'Income') {
      summary.income += amount;
    } else {
      summary.expense += amount;
    }
    return summary;
  }, { income: 0, expense: 0 });

  const categoryTotals = Object.entries(records.reduce((summary, record) => {
    summary[record.category] = (summary[record.category] || 0) + Number(record.amount || 0);
    return summary;
  }, {})).sort(([, left], [, right]) => right - left);

  // Tab configuration based on permissions
  const availableTabs = [
    // All users can see their own records
    {
      id: 'own-records',
      label: 'My Records',
      description: 'Create and view your own financial records'
    },
    // All users can request edit/delete for their own records
    {
      id: 'edit-delete-own',
      label: 'Edit/Delete My Records',
      description: 'Request changes or deletion of your records'
    },
    // Only elevated roles can view all records
    ...(perms.canViewAllRecords ? [{
      id: 'view-all-records',
      label: 'View All Records',
      description: 'View financial records from all users'
    }] : []),
    // Only Admin can manage all records
    ...(perms.canManageAllRecords ? [{
      id: 'manage-all-records',
      label: 'Manage All Records',
      description: 'Full control over all user records'
    }] : [])
  ];

  return (
    <div className={embedded ? 'space-y-6' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'}>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          {!embedded && <h1 className="text-3xl font-bold text-gray-900">Financial Records</h1>}
          <p className={`${embedded ? '' : 'mt-2 '}text-gray-600`}>
            Manage your financial records with role-based permissions and approval workflows.
          </p>
        </div>
        <div className="flex gap-3">
          {perms.canCreateAndViewOwn && (
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Add Record
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      {availableTabs.length > 1 && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {availableTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Tab Description */}
      {availableTabs.find(tab => tab.id === activeTab) && (
        <div className="rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            {availableTabs.find(tab => tab.id === activeTab)?.description}
          </p>
        </div>
      )}

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">{success}</div>}

      <div className="rounded-lg bg-white p-6 shadow-xl space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(event) => handleFilterChange('search', event.target.value)}
              placeholder={perms.canViewAllRecords && (activeTab === 'view-all-records' || activeTab === 'manage-all-records') ? 'Search notes, category, or user' : 'Search notes or category'}
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
              <option value="Income">Income</option>
              <option value="Expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select
              value={filters.category}
              onChange={(event) => handleFilterChange('category', event.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) => handleFilterChange('startDate', event.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) => handleFilterChange('endDate', event.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* User Filter - Only show for tabs that can view all records */}
        {perms.canViewAllRecords && (activeTab === 'view-all-records' || activeTab === 'manage-all-records') && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-green-50 p-4">
            <p className="text-sm text-green-700">Income</p>
            <p className="mt-1 text-2xl font-semibold text-green-800">{currency(totals.income)}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-4">
            <p className="text-sm text-red-700">Expense</p>
            <p className="mt-1 text-2xl font-semibold text-red-800">{currency(totals.expense)}</p>
          </div>
          <div className="rounded-lg bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Net Balance</p>
            <p className="mt-1 text-2xl font-semibold text-blue-800">{currency(totals.income - totals.expense)}</p>
          </div>
        </div>

        {/* Records Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                  {perms.canViewAllRecords && (activeTab === 'view-all-records' || activeTab === 'manage-all-records') && <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">User</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={perms.canViewAllRecords && (activeTab === 'view-all-records' || activeTab === 'manage-all-records') ? 7 : 6} className="px-6 py-12 text-center text-gray-500">Loading records...</td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={perms.canViewAllRecords && (activeTab === 'view-all-records' || activeTab === 'manage-all-records') ? 7 : 6} className="px-6 py-12 text-center text-gray-500">No records found.</td>
                  </tr>
                ) : records.map((record) => {
                  const isOwnRecord = record.user_id === user?.id;
                  const canEditThisRecord = canDirectEdit || (isOwnRecord && perms.canEditDeleteOwnWithRequest);
                  const canDeleteThisRecord = canDirectEdit || (isOwnRecord && perms.canEditDeleteOwnWithRequest);

                  return (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                      {perms.canViewAllRecords && (activeTab === 'view-all-records' || activeTab === 'manage-all-records') && (
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="font-medium">{record.user?.name || 'Unknown User'}</div>
                          <div className="text-gray-500">{record.user?.email || '-'}</div>
                        </td>
                      )}
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{record.type}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{record.category}</td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">{currency(record.amount)}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs whitespace-pre-wrap break-words">{record.description || '-'}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <div className="flex gap-3">
                          {perms.canEditDeleteOwnWithRequest && canEditThisRecord && (
                            <button
                              type="button"
                              onClick={() => openEdit(record)}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {canDirectEdit ? 'Edit' : 'Request Edit'}
                            </button>
                          )}
                          {perms.canEditDeleteOwnWithRequest && canDeleteThisRecord && (
                            <button
                              type="button"
                              onClick={() => handleDelete(record)}
                              className="text-red-600 hover:text-red-800"
                            >
                              {canDirectEdit ? 'Delete' : 'Request Delete'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {pagination.totalPages > 1 && (
            <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))} disabled={pagination.page <= 1} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50">Previous</button>
                <button type="button" onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))} disabled={pagination.page >= pagination.totalPages} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>

        {/* Category Breakdown */}
        <div className="rounded-lg bg-gray-50 p-6">
          <h2 className="text-lg font-medium text-gray-900">Category Breakdown</h2>
          <div className="mt-4 space-y-3">
            {categoryTotals.length === 0 ? (
              <p className="text-sm text-gray-600">No category totals available for the current filters.</p>
            ) : categoryTotals.map(([category, total]) => (
              <div key={category} className="flex items-center justify-between rounded-lg bg-white px-4 py-3">
                <span className="text-sm text-gray-700">{category}</span>
                <span className="text-sm font-semibold text-gray-900">{currency(total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
          onClick={closeForm}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {editingRecord ? (canDirectEdit ? 'Edit Record' : 'Submit Edit Request') : 'Add Record'}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {editingRecord && !canDirectEdit ? 'Explain in detail what should be changed so reviewer knows exactly what to do.' : 'Enter record details below.'}
                </p>
              </div>
              <button type="button" onClick={closeForm} className="text-gray-400 hover:text-gray-600">Close</button>
            </div>
            <form onSubmit={handleSave} className="space-y-5 px-6 py-6">
              {editingRecord && !canDirectEdit && (
                <div className="rounded-lg border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  Include exact correction, reason for it, and anything that approver should verify.
                </div>
              )}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select value={formData.type} onChange={(event) => setFormData((prev) => ({ ...prev, type: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select value={formData.category} onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required>
                    {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input type="number" step="0.01" value={formData.amount} onChange={(event) => setFormData((prev) => ({ ...prev, amount: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" value={formData.date} onChange={(event) => setFormData((prev) => ({ ...prev, date: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" required />
                </div>
              </div>

              {!editingRecord && perms.canManageAllRecords && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <select value={formData.userId} onChange={(event) => setFormData((prev) => ({ ...prev, userId: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select User</option>
                    {users.map((account) => <option key={account.id} value={account.id}>{account.name} ({account.email})</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea rows={4} value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe this record" required />
              </div>

              {editingRecord && !canDirectEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Detailed Request For Approval</label>
                  <textarea rows={4} value={requestReason} onChange={(event) => setRequestReason(event.target.value)} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Example: Please change the amount from 2600 to 2100 because the original bill included a duplicate charge. Keep the same date and category." required />
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeForm} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                  {saving ? 'Saving...' : editingRecord ? (canDirectEdit ? 'Update Record' : 'Submit Request') : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Request Modal */}
      {deleteRequest.open && deleteRequest.record && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4"
          onClick={() => setDeleteRequest({ open: false, record: null, reason: '' })}
        >
          <div
            className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Submit Delete Request</h2>
              <p className="mt-1 text-sm text-gray-600">Tell the reviewer in detail why this record should be removed.</p>
            </div>
            <form
              onSubmit={async (event) => {
                event.preventDefault();
                if (deleteRequest.reason.trim().length < 10) {
                  setError('Please explain in detail why this record should be deleted.');
                  return;
                }
                await submitDelete(deleteRequest.record.id, deleteRequest.reason.trim());
              }}
              className="space-y-5 px-6 py-6"
            >
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                <div><strong>Category:</strong> {deleteRequest.record.category}</div>
                <div><strong>Amount:</strong> {currency(deleteRequest.record.amount)}</div>
                <div><strong>Date:</strong> {new Date(deleteRequest.record.date).toLocaleDateString()}</div>
                <div className="mt-2 whitespace-pre-wrap"><strong>Description:</strong> {deleteRequest.record.description || '-'}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Detailed Delete Request</label>
                <textarea rows={5} value={deleteRequest.reason} onChange={(event) => setDeleteRequest((prev) => ({ ...prev, reason: event.target.value }))} className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Example: This expense was entered twice. Please remove this duplicate and keep the other record that has the correct invoice." required />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setDeleteRequest({ open: false, record: null, reason: '' })} className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50">
                  {saving ? 'Submitting...' : 'Submit Delete Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;
