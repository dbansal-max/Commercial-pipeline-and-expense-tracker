import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { roleAPI } from '../../services/api';
import RoleCreationForm from './RoleCreationForm';

const RoleManagement = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await roleAPI.getAllRoles();
      
      if (response.data.success) {
        setRoles(response.data.data);
      } else {
        setError(response.data.message || 'Failed to fetch roles');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleCreated = (newRole) => {
    setRoles(prev => [...prev, newRole]);
    setShowCreateForm(false);
  };

  const handleRoleUpdated = (updatedRole) => {
    setRoles(prev => prev.map(role => 
      role.id === updatedRole.id ? updatedRole : role
    ));
    setEditingRole(null);
  };

  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await roleAPI.deleteRole(roleId);
      
      if (response.data.success) {
        setRoles(prev => prev.filter(role => role.id !== roleId));
      } else {
        alert('Failed to delete role: ' + response.data.message);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    }
  };

  const getPermissionList = (permissions) => {
    const permissionLabels = {
      canCreateRecords: 'Create Records',
      canEditOwnRecords: 'Edit Own Records',
      canDeleteOwnRecords: 'Delete Own Records',
      canViewAllRecords: 'View All Records',
      canEditAllRecords: 'Edit All Records',
      canDeleteAllRecords: 'Delete All Records',
      canManageUsers: 'Manage Users',
      canManageRoles: 'Manage Roles',
      canApproveRequests: 'Approve Requests',
      canManageSettings: 'Manage Settings'
    };

    return Object.entries(permissions)
      .filter(([_, hasPermission]) => hasPermission)
      .map(([key, _]) => permissionLabels[key])
      .join(', ');
  };

  if (!hasPermission('canManageRoles')) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center py-8">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to manage roles.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Role Management</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {showCreateForm ? 'Cancel' : 'Create Role'}
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-6">
            <RoleCreationForm onRoleCreated={handleRoleCreated} />
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading roles...</p>
          </div>
        ) : (
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
                    Permissions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {role.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {role.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-md">
                        {getPermissionList(role.permissions)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {role._count?.users || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingRole(role)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      {role.name !== 'Admin' && (
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {roles.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600">No roles found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {editingRole && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Role</h3>
          <EditRoleForm 
            role={editingRole} 
            onRoleUpdated={handleRoleUpdated}
            onCancel={() => setEditingRole(null)}
          />
        </div>
      )}
    </div>
  );
};

// Edit Role Form Component
const EditRoleForm = ({ role, onRoleUpdated, onCancel }) => {
  const { hasPermission } = useAuth();
  const [formData, setFormData] = useState({
    name: role.name,
    description: role.description,
    permissions: role.permissions
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const permissionLabels = {
    canCreateRecords: 'Create Records',
    canEditOwnRecords: 'Edit Own Records',
    canDeleteOwnRecords: 'Delete Own Records',
    canViewAllRecords: 'View All Records',
    canEditAllRecords: 'Edit All Records',
    canDeleteAllRecords: 'Delete All Records',
    canManageUsers: 'Manage Users',
    canManageRoles: 'Manage Roles',
    canApproveRequests: 'Approve Requests',
    canManageSettings: 'Manage Settings'
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasPermission('canManageRoles')) {
      alert('You do not have permission to edit roles');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await roleAPI.updateRole(role.id, formData);
      
      if (response.data.success) {
        onRoleUpdated(response.data.data);
      } else {
        alert('Failed to update role: ' + response.data.message);
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Role Name
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Permissions
        </label>
        
        <div className="space-y-3">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Record Management</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(permissionLabels).slice(0, 6).map(([key, label]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    name={key}
                    checked={formData.permissions[key]}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Administrative</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(permissionLabels).slice(6).map(([key, label]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    name={key}
                    checked={formData.permissions[key]}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Updating...' : 'Update Role'}
        </button>
      </div>
    </form>
  );
};

export default RoleManagement;
