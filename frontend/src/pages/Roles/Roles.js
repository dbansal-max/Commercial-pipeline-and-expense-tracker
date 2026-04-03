import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import roleAPI from '../../services/roleAPI';
import userAPI from '../../services/userAPI';

const Roles = () => {
  useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [deletingRole, setDeletingRole] = useState(null);
  const [activeTab, setActiveTab] = useState('view');

  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      canCreateRecords: true,
      canEditOwnRecords: false,
      canDeleteOwnRecords: false,
      canViewAllRecords: false,
      canEditAllRecords: false,
      canDeleteAllRecords: false,
      canManageUsers: false,
      canManageRoles: false,
      canApproveRequests: false,
      canManageSettings: false
    }
  });

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await roleAPI.getRoles();
      if (response.success) {
        setRoles(response.data);
      }
    } catch (error) {
      setError('Failed to fetch roles');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getUsers({ limit: 1000 });
      if (response.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let response;
      if (editingRole) {
        response = await roleAPI.updateRole(editingRole.id, formData);
      } else {
        response = await roleAPI.createRole(formData);
      }

      if (response.success) {
        setSuccess(editingRole ? 'Role updated successfully!' : 'Role created successfully!');
        setShowAddForm(false);
        setEditingRole(null);
        setFormData({
          name: '',
          description: '',
          permissions: {
            canCreateRecords: true,
            canEditOwnRecords: false,
            canDeleteOwnRecords: false,
            canViewAllRecords: false,
            canEditAllRecords: false,
            canDeleteAllRecords: false,
            canManageUsers: false,
            canManageRoles: false,
            canApproveRequests: false,
            canManageSettings: false
          }
        });
        fetchRoles();
      } else {
        setError(response.message || 'Failed to save role');
      }
    } catch (error) {
      setError('Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || {
        canCreateRecords: true,
        canEditOwnRecords: false,
        canDeleteOwnRecords: false,
        canViewAllRecords: false,
        canEditAllRecords: false,
        canDeleteAllRecords: false,
        canManageUsers: false,
        canManageRoles: false,
        canApproveRequests: false,
        canManageSettings: false
      }
    });
    setShowAddForm(true);
  };

  const handleDelete = async (roleId) => {
    const roleUsers = users.filter(u => u.role_id === roleId);

    if (roleUsers.length > 0) {
      setError(`Cannot delete role. ${roleUsers.length} user(s) are assigned to this role. Please reassign them first.`);
      return;
    }

    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingRole(roleId);
      const response = await roleAPI.deleteRole(roleId);
      if (response.success) {
        setSuccess('Role deleted successfully!');
        fetchRoles();
      } else {
        setError(response.message || 'Failed to delete role');
      }
    } catch (error) {
      setError('Failed to delete role');
    } finally {
      setDeletingRole(null);
    }
  };

  const handlePermissionToggle = (permission) => {
    setFormData({
      ...formData,
      permissions: {
        ...formData.permissions,
        [permission]: !formData.permissions[permission]
      }
    });
  };

  const getUserCountForRole = (roleId) => {
    return users.filter(u => u.role_id === roleId).length;
  };

  const getPermissionBadge = (hasPermission) => {
    return hasPermission ? (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
        ✓
      </span>
    ) : (
      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
        ✗
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
            <p className="mt-2 text-gray-600">Manage system roles and permissions</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <span>🔐</span>
            <span>Create Role</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      <div className="bg-white shadow-xl rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {['view', 'add', 'permissions', 'analytics'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* View Roles Tab */}
          {activeTab === 'view' && (
            <div className="space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Key Permissions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                          No roles found
                        </td>
                      </tr>
                    ) : (
                      roles.map((role) => (
                        <tr key={role.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-purple-600 font-medium">
                                    {role.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{role.name}</div>
                                <div className="text-sm text-gray-500">ID: {role.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {role.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {getUserCountForRole(role.id)} users
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-1">
                              {getPermissionBadge(role.permissions?.canCreateRecords || false)}
                              {getPermissionBadge(role.permissions?.canManageUsers || false)}
                              {getPermissionBadge(role.permissions?.canApproveRequests || false)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEdit(role)}
                              className="text-purple-600 hover:text-purple-900 mr-3"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(role.id)}
                              disabled={deletingRole === role.id || getUserCountForRole(role.id) > 0}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              {deletingRole === role.id ? 'Deleting...' : 'Delete'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Role Tab */}
          {(activeTab === 'add' || showAddForm) && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., Senior Analyst"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Brief description of the role"
                    />
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Permissions</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canCreateRecords}
                        onChange={() => handlePermissionToggle('canCreateRecords')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Create Records</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canEditOwnRecords}
                        onChange={() => handlePermissionToggle('canEditOwnRecords')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Edit Own Records</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canDeleteOwnRecords}
                        onChange={() => handlePermissionToggle('canDeleteOwnRecords')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Delete Own Records</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canViewAllRecords}
                        onChange={() => handlePermissionToggle('canViewAllRecords')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">View All Records</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canEditAllRecords}
                        onChange={() => handlePermissionToggle('canEditAllRecords')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Edit All Records</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canDeleteAllRecords}
                        onChange={() => handlePermissionToggle('canDeleteAllRecords')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Delete All Records</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageUsers}
                        onChange={() => handlePermissionToggle('canManageUsers')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Manage Users</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageRoles}
                        onChange={() => handlePermissionToggle('canManageRoles')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Manage Roles</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canApproveRequests}
                        onChange={() => handlePermissionToggle('canApproveRequests')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Approve Requests</span>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData.permissions.canManageSettings}
                        onChange={() => handlePermissionToggle('canManageSettings')}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Manage Settings</span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  {showAddForm && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddForm(false);
                        setEditingRole(null);
                        setFormData({
                          name: '',
                          description: '',
                          permissions: {
                            canCreateRecords: true,
                            canEditOwnRecords: false,
                            canDeleteOwnRecords: false,
                            canViewAllRecords: false,
                            canEditAllRecords: false,
                            canDeleteAllRecords: false,
                            canManageUsers: false,
                            canManageRoles: false,
                            canApproveRequests: false,
                            canManageSettings: false
                          }
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Permissions Matrix Tab */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Permission Matrix</h3>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Permission
                      </th>
                      {roles.map(role => (
                        <th key={role.id} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {role.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {[
                      { key: 'canCreateRecords', label: 'Create Records' },
                      { key: 'canEditOwnRecords', label: 'Edit Own Records' },
                      { key: 'canDeleteOwnRecords', label: 'Delete Own Records' },
                      { key: 'canViewAllRecords', label: 'View All Records' },
                      { key: 'canEditAllRecords', label: 'Edit All Records' },
                      { key: 'canDeleteAllRecords', label: 'Delete All Records' },
                      { key: 'canManageUsers', label: 'Manage Users' },
                      { key: 'canManageRoles', label: 'Manage Roles' },
                      { key: 'canApproveRequests', label: 'Approve Requests' },
                      { key: 'canManageSettings', label: 'Manage Settings' }
                    ].map(permission => (
                      <tr key={permission.key}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {permission.label}
                        </td>
                        {roles.map(role => (
                          <td key={role.id} className="px-6 py-4 whitespace-nowrap text-center">
                            {getPermissionBadge(role.permissions?.[permission.key] || false)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Role Analytics</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-purple-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-purple-800">Total Roles</h4>
                  <p className="text-2xl font-bold text-purple-600">{roles.length}</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-blue-800">Total Users</h4>
                  <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                </div>

                <div className="bg-green-50 rounded-lg p-6">
                  <h4 className="text-sm font-medium text-green-800">Avg Users per Role</h4>
                  <p className="text-2xl font-bold text-green-600">
                    {roles.length > 0 ? (users.length / roles.length).toFixed(1) : 0}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <h4 className="text-sm font-medium text-gray-800 mb-4">Role Distribution</h4>
                <div className="space-y-3">
                  {roles.map(role => {
                    const userCount = getUserCountForRole(role.id);
                    const percentage = users.length > 0 ? (userCount / users.length) * 100 : 0;

                    return (
                      <div key={role.id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-900">{role.name}</span>
                          <span className="text-sm text-gray-500">{userCount} users ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Roles;
