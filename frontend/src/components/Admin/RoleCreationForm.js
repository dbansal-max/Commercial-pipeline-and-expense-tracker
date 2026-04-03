import React, { useState } from 'react';
import { toast } from 'react-toastify';
import roleAPI from '../../services/roleAPI';

const RoleCreationForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: {
      canCreateRecords: false,
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

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    // Check if at least one permission is selected
    const hasAnyPermission = Object.values(formData.permissions).some(permission => permission);
    if (!hasAnyPermission) {
      newErrors.permissions = 'At least one permission must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const data = await roleAPI.createRole(formData);

      if (data.success) {
        toast.success('Role created successfully!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          permissions: {
            canCreateRecords: false,
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
        setErrors({});
      } else {
        toast.error(data.message || 'Failed to create role');
        setErrors({ submit: data.message || 'Failed to create role' });
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('An error occurred while creating the role');
      setErrors({ submit: 'An error occurred while creating the role' });
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create New Role</h2>
        <p className="text-gray-600">Define a new user role with specific permissions</p>
      </div>

      {errors.submit && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter role name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description *
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe the role and its purpose"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Role Permissions
          </label>
          
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(formData.permissions).map(([key, value]) => (
                <div key={key} className="flex items-center p-3 border rounded-lg border-gray-200 hover:border-blue-300 transition-colors">
                  <input
                    type="checkbox"
                    name={key}
                    checked={value}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-3 text-sm font-medium text-gray-700">
                    {permissionLabels[key]}
                  </label>
                </div>
              ))}
            </div>
          </div>
          {errors.permissions && (
            <p className="mt-2 text-sm text-red-600">{errors.permissions}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setFormData({
                name: '',
                description: '',
                permissions: {
                  canCreateRecords: false,
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
              setErrors({});
            }}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Clear
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Role...
              </span>
            ) : (
              'Create Role'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RoleCreationForm;
