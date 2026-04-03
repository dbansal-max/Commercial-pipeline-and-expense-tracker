import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import userAPI from '../../services/userAPI';
import roleAPI from '../../services/roleAPI';
import UserCreationForm from './UserCreationForm';

const USER_PAGE_SIZE = 8;
const INITIAL_FILTERS = {
  search: '',
  status: '',
  role: ''
};

const normalizeUser = (user) => ({
  ...user,
  role: user.role?.name || user.role || 'Unknown',
  role_id: user.role_id || user.role?.id || ''
});

const getRoleBadgeColor = (role) => {
  switch (role) {
    case 'Admin':
      return 'bg-purple-100 text-purple-800';
    case 'Finance Manager':
      return 'bg-indigo-100 text-indigo-800';
    case 'Analyst':
      return 'bg-blue-100 text-blue-800';
    case 'Employee':
      return 'bg-emerald-100 text-emerald-800';
    case 'Viewer':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusBadgeColor = (status) => (
  status === 'Active'
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800'
);

const UserManagement = () => {
  const { user: currentUser, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
    limit: USER_PAGE_SIZE
  });

  const fetchRoles = useCallback(async () => {
    try {
      const response = await roleAPI.getRoles();
      if (response.success) {
        setRoles(response.data || []);
      }
    } catch (fetchError) {
      console.error('Failed to fetch roles:', fetchError);
    }
  }, []);

  const fetchUsers = useCallback(async ({
    page = 1,
    search = '',
    status = '',
    role = ''
  } = {}) => {
    try {
      setLoading(true);
      setError('');

      const response = await userAPI.getUsers({
        page,
        limit: USER_PAGE_SIZE,
        search,
        status,
        role
      });

      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch users');
      }

      const data = response.data || {};

      setUsers((data.users || []).map(normalizeUser));
      setPagination({
        page: data.page || page,
        totalPages: Math.max(data.totalPages || 1, 1),
        total: data.total || 0,
        limit: data.limit || USER_PAGE_SIZE
      });
    } catch (fetchError) {
      console.error('Failed to fetch users:', fetchError);
      setUsers([]);
      setError(fetchError.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const syncListing = useCallback(async (page, nextFilters) => {
    setFilters(nextFilters);
    setPagination((prev) => ({
      ...prev,
      page
    }));
    await fetchUsers({
      page,
      ...nextFilters
    });
  }, [fetchUsers]);

  useEffect(() => {
    fetchRoles();
    fetchUsers({
      page: 1,
      ...INITIAL_FILTERS
    });
  }, [fetchRoles, fetchUsers]);

  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    await syncListing(1, {
      ...filters,
      search: searchInput.trim()
    });
  };

  const handleStatusFilterChange = async (event) => {
    const nextFilters = {
      ...filters,
      status: event.target.value
    };
    await syncListing(1, nextFilters);
  };

  const handleRoleFilterChange = async (event) => {
    const nextFilters = {
      ...filters,
      role: event.target.value
    };
    await syncListing(1, nextFilters);
  };

  const handleResetFilters = async () => {
    setSearchInput('');
    await syncListing(1, INITIAL_FILTERS);
  };

  const handleUserCreated = async () => {
    toast.success('User created successfully');
    setShowCreateForm(false);
    setSearchInput('');
    await syncListing(1, INITIAL_FILTERS);
  };

  const handleOpenEdit = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role_id: user.role_id || '',
      role: user.role
    });
  };

  const handleSaveUser = async (formData) => {
    try {
      setIsSaving(true);
      const response = await userAPI.updateUser(editingUser.id, formData);

      if (!response.success) {
        throw new Error(response.message || 'Failed to update user');
      }

      toast.success('User updated successfully');
      setEditingUser(null);
      await fetchUsers({
        page: pagination.page,
        ...filters
      });
    } catch (saveError) {
      console.error('Failed to update user:', saveError);
      toast.error(saveError.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = async (targetUser) => {
    const nextStatus = targetUser.status === 'Active' ? 'Inactive' : 'Active';

    if (currentUser?.id === targetUser.id && nextStatus === 'Inactive') {
      toast.warn('You cannot deactivate your own account');
      return;
    }

    try {
      const response = await userAPI.updateUserStatus(targetUser.id, nextStatus);

      if (!response.success) {
        throw new Error(response.message || 'Failed to update user status');
      }

      toast.success(`User ${nextStatus.toLowerCase()} successfully`);
      await fetchUsers({
        page: pagination.page,
        ...filters
      });
    } catch (statusError) {
      console.error('Failed to update user status:', statusError);
      toast.error(statusError.message || 'Failed to update user status');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (currentUser?.id === targetUser.id) {
      toast.warn('You cannot delete your own account');
      return;
    }

    if (!window.confirm(`Delete ${targetUser.name}? This action will remove the user from active lists.`)) {
      return;
    }

    try {
      const response = await userAPI.deleteUser(targetUser.id);

      if (!response.success) {
        throw new Error(response.message || 'Failed to delete user');
      }

      const nextPage = users.length === 1 && pagination.page > 1
        ? pagination.page - 1
        : pagination.page;

      toast.success('User deleted successfully');
      await syncListing(nextPage, filters);
    } catch (deleteError) {
      console.error('Failed to delete user:', deleteError);
      toast.error(deleteError.message || 'Failed to delete user');
    }
  };

  if (!hasPermission('canManageUsers')) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You do not have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="mt-1 text-sm text-gray-600">
              Search, update, activate, and remove system users from one place.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm((prev) => !prev)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showCreateForm ? 'Close Form' : 'Create User'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm text-blue-700">Filtered Users</p>
            <p className="mt-1 text-2xl font-semibold text-blue-900">{pagination.total}</p>
          </div>
          <div className="rounded-lg border border-green-100 bg-green-50 p-4">
            <p className="text-sm text-green-700">Active On This Page</p>
            <p className="mt-1 text-2xl font-semibold text-green-900">
              {users.filter((item) => item.status === 'Active').length}
            </p>
          </div>
          <div className="rounded-lg border border-purple-100 bg-purple-50 p-4">
            <p className="text-sm text-purple-700">Current Page</p>
            <p className="mt-1 text-2xl font-semibold text-purple-900">
              {pagination.page} / {pagination.totalPages}
            </p>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search User
            </label>
            <input
              type="text"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by name or email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={handleStatusFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={filters.role}
              onChange={handleRoleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-4 flex flex-wrap gap-3">
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800"
            >
              Apply Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Reset Filters
            </button>
          </div>
        </form>

        {showCreateForm && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <UserCreationForm onUserCreated={handleUserCreated} />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
            <p className="mt-3 text-sm text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="mt-2 text-sm text-gray-600">
              Try adjusting your search or filter settings.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                            {currentUser?.id === user.id && (
                              <span className="ml-2 text-xs font-medium text-blue-600">
                                Current User
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-3">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleStatusToggle(user)}
                            className={user.status === 'Active' ? 'text-amber-600 hover:text-amber-800' : 'text-green-600 hover:text-green-800'}
                          >
                            {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-600">
                Showing {(pagination.page - 1) * pagination.limit + 1}
                {' '}to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)}
                {' '}of {pagination.total} users
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => syncListing(pagination.page - 1, filters)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => syncListing(pagination.page + 1, filters)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Edit User</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Update role, status, and account details.
                </p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              <EditUserForm
                user={editingUser}
                roles={roles}
                isSubmitting={isSaving}
                onCancel={() => setEditingUser(null)}
                onSubmit={handleSaveUser}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const EditUserForm = ({ user, roles, isSubmitting, onCancel, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    roleId: user.role_id || '',
    status: user.status || 'Active'
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      name: user.name || '',
      email: user.email || '',
      roleId: user.role_id || '',
      status: user.status || 'Active'
    });
    setErrors({});
  }, [user]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextErrors.email = 'Enter a valid email address';
    }

    if (!formData.roleId) {
      nextErrors.roleId = 'Role is required';
    }

    if (!formData.status) {
      nextErrors.status = 'Status is required';
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.name && (
            <p className="mt-2 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {errors.email && (
            <p className="mt-2 text-sm text-red-600">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role
          </label>
          <select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
              errors.roleId ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="">Select a role</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          {errors.roleId && (
            <p className="mt-2 text-sm text-red-600">{errors.roleId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
              errors.status ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          {errors.status && (
            <p className="mt-2 text-sm text-red-600">{errors.status}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default UserManagement;
