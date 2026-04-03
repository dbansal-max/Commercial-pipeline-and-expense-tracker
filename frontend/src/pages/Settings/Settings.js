import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import settingsAPI from '../../services/settingsAPI';

const Settings = () => {
  useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const [settings, setSettings] = useState({
    general: {
      siteName: 'Finance Management System',
      siteDescription: 'Comprehensive finance tracking and management platform',
      companyLogo: null,
      favicon: null,
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      language: 'en'
    },
    dashboard: {
      defaultView: 'overview',
      refreshInterval: 30,
      showQuickActions: true,
      showRecentActivity: true,
      showNotifications: true,
      maxRecentRecords: 10,
      chartType: 'line'
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      emailAlerts: {
        newUser: true,
        newRecord: false,
        systemUpdates: true,
        securityAlerts: true
      },
      smsAlerts: {
        criticalErrors: true,
        securityBreaches: true,
        systemDowntime: true
      }
    },
    security: {
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireLowercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecialChars: true,
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      lockoutDuration: 15,
      twoFactorAuth: false
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      backupLocation: 'local',
      emailBackupReports: true,
      includeFiles: true
    },
    api: {
      rateLimitEnabled: true,
      rateLimitRequests: 1000,
      rateLimitWindow: 3600,
      corsEnabled: true,
      corsOrigins: ['http://localhost:3000'],
      apiVersioning: true,
      documentationEnabled: true
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      if (response.success) {
        setSettings(response.data);
      }
    } catch (error) {
      setError('Failed to load settings');
    }
  };

  const handleSave = async (category) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await settingsAPI.updateSettings({
        [category]: settings[category]
      });

      if (response.success) {
        setSuccess(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully!`);
      } else {
        setError(response.message || 'Failed to save settings');
      }
    } catch (error) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (category, setting, value) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [setting]: value
      }
    });
  };

  const handleNestedSettingChange = (category, nestedCategory, setting, value) => {
    setSettings({
      ...settings,
      [category]: {
        ...settings[category],
        [nestedCategory]: {
          ...settings[category][nestedCategory],
          [setting]: value
        }
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">Configure your application preferences</p>
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
            {['general', 'dashboard', 'notifications', 'security', 'backup', 'api'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Site Name</label>
                  <input
                    type="text"
                    value={settings.general.siteName}
                    onChange={(e) => handleSettingChange('general', 'siteName', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Timezone</label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => handleSettingChange('general', 'timezone', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Asia/Kolkata">Asia/Kolkata</option>
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Format</label>
                  <select
                    value={settings.general.dateFormat}
                    onChange={(e) => handleSettingChange('general', 'dateFormat', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Time Format</label>
                  <select
                    value={settings.general.timeFormat}
                    onChange={(e) => handleSettingChange('general', 'timeFormat', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="24h">24-hour</option>
                    <option value="12h">12-hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Language</label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => handleSettingChange('general', 'language', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="es">Spanish</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Site Description</label>
                <textarea
                  rows={3}
                  value={settings.general.siteDescription}
                  onChange={(e) => handleSettingChange('general', 'siteDescription', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('general')}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save General Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Dashboard Settings */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Dashboard Preferences</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Default View</label>
                  <select
                    value={settings.dashboard.defaultView}
                    onChange={(e) => handleSettingChange('dashboard', 'defaultView', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="overview">Overview</option>
                    <option value="records">Records</option>
                    <option value="analytics">Analytics</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Refresh Interval (seconds)</label>
                  <input
                    type="number"
                    value={settings.dashboard.refreshInterval}
                    onChange={(e) => handleSettingChange('dashboard', 'refreshInterval', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={10}
                    max={300}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Recent Records</label>
                  <input
                    type="number"
                    value={settings.dashboard.maxRecentRecords}
                    onChange={(e) => handleSettingChange('dashboard', 'maxRecentRecords', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={5}
                    max={50}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Chart Type</label>
                  <select
                    value={settings.dashboard.chartType}
                    onChange={(e) => handleSettingChange('dashboard', 'chartType', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="line">Line</option>
                    <option value="bar">Bar</option>
                    <option value="area">Area</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.dashboard.showQuickActions}
                    onChange={(e) => handleSettingChange('dashboard', 'showQuickActions', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Quick Actions</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.dashboard.showRecentActivity}
                    onChange={(e) => handleSettingChange('dashboard', 'showRecentActivity', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Recent Activity</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.dashboard.showNotifications}
                    onChange={(e) => handleSettingChange('dashboard', 'showNotifications', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Show Notifications</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('dashboard')}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Dashboard Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>

              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">General Notifications</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'emailNotifications', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Email Notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.smsNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'smsNotifications', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable SMS Notifications</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.pushNotifications}
                        onChange={(e) => handleSettingChange('notifications', 'pushNotifications', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Enable Push Notifications</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Email Alerts</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailAlerts.newUser}
                        onChange={(e) => handleNestedSettingChange('notifications', 'emailAlerts', 'newUser', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">New User Registration</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailAlerts.newRecord}
                        onChange={(e) => handleNestedSettingChange('notifications', 'emailAlerts', 'newRecord', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">New Financial Records</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailAlerts.systemUpdates}
                        onChange={(e) => handleNestedSettingChange('notifications', 'emailAlerts', 'systemUpdates', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">System Updates</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.emailAlerts.securityAlerts}
                        onChange={(e) => handleNestedSettingChange('notifications', 'emailAlerts', 'securityAlerts', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Security Alerts</span>
                    </label>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">SMS Alerts</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.smsAlerts.criticalErrors}
                        onChange={(e) => handleNestedSettingChange('notifications', 'smsAlerts', 'criticalErrors', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Critical Errors</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.smsAlerts.securityBreaches}
                        onChange={(e) => handleNestedSettingChange('notifications', 'smsAlerts', 'securityBreaches', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Security Breaches</span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={settings.notifications.smsAlerts.systemDowntime}
                        onChange={(e) => handleNestedSettingChange('notifications', 'smsAlerts', 'systemDowntime', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">System Downtime</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('notifications')}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Notification Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password Min Length</label>
                  <input
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) => handleSettingChange('security', 'passwordMinLength', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={6}
                    max={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={5}
                    max={480}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Max Login Attempts</label>
                  <input
                    type="number"
                    value={settings.security.maxLoginAttempts}
                    onChange={(e) => handleSettingChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={3}
                    max={10}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Lockout Duration (minutes)</label>
                  <input
                    type="number"
                    value={settings.security.lockoutDuration}
                    onChange={(e) => handleSettingChange('security', 'lockoutDuration', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={5}
                    max={60}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-900">Password Requirements</h4>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.passwordRequireUppercase}
                    onChange={(e) => handleSettingChange('security', 'passwordRequireUppercase', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Require Uppercase Letters</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.passwordRequireLowercase}
                    onChange={(e) => handleSettingChange('security', 'passwordRequireLowercase', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Require Lowercase Letters</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.passwordRequireNumbers}
                    onChange={(e) => handleSettingChange('security', 'passwordRequireNumbers', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Require Numbers</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.passwordRequireSpecialChars}
                    onChange={(e) => handleSettingChange('security', 'passwordRequireSpecialChars', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Require Special Characters</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.security.twoFactorAuth}
                    onChange={(e) => handleSettingChange('security', 'twoFactorAuth', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Two-Factor Authentication</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('security')}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Security Settings'}
                </button>
              </div>
            </div>
          )}

          {/* Backup Settings */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Backup Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Backup Frequency</label>
                  <select
                    value={settings.backup.backupFrequency}
                    onChange={(e) => handleSettingChange('backup', 'backupFrequency', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Backup Retention (days)</label>
                  <input
                    type="number"
                    value={settings.backup.backupRetention}
                    onChange={(e) => handleSettingChange('backup', 'backupRetention', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={7}
                    max={365}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Backup Location</label>
                  <select
                    value={settings.backup.backupLocation}
                    onChange={(e) => handleSettingChange('backup', 'backupLocation', e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="local">Local</option>
                    <option value="cloud">Cloud</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.backup.autoBackup}
                    onChange={(e) => handleSettingChange('backup', 'autoBackup', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Automatic Backup</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.backup.emailBackupReports}
                    onChange={(e) => handleSettingChange('backup', 'emailBackupReports', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Email Backup Reports</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.backup.includeFiles}
                    onChange={(e) => handleSettingChange('backup', 'includeFiles', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Include Files in Backup</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('backup')}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Backup Settings'}
                </button>
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">API Settings</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rate Limit Requests</label>
                  <input
                    type="number"
                    value={settings.api.rateLimitRequests}
                    onChange={(e) => handleSettingChange('api', 'rateLimitRequests', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={100}
                    max={10000}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Rate Limit Window (seconds)</label>
                  <input
                    type="number"
                    value={settings.api.rateLimitWindow}
                    onChange={(e) => handleSettingChange('api', 'rateLimitWindow', parseInt(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={60}
                    max={86400}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">CORS Origins</label>
                <div className="mt-1 space-y-2">
                  {settings.api.corsOrigins.map((origin, index) => (
                    <div key={index} className="flex space-x-2">
                      <input
                        type="text"
                        value={origin}
                        onChange={(e) => {
                          const newOrigins = [...settings.api.corsOrigins];
                          newOrigins[index] = e.target.value;
                          handleSettingChange('api', 'corsOrigins', newOrigins);
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => {
                          const newOrigins = settings.api.corsOrigins.filter((_, i) => i !== index);
                          handleSettingChange('api', 'corsOrigins', newOrigins);
                        }}
                        className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => handleSettingChange('api', 'corsOrigins', [...settings.api.corsOrigins, ''])}
                    className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Add Origin
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.api.rateLimitEnabled}
                    onChange={(e) => handleSettingChange('api', 'rateLimitEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable Rate Limiting</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.api.corsEnabled}
                    onChange={(e) => handleSettingChange('api', 'corsEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable CORS</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.api.apiVersioning}
                    onChange={(e) => handleSettingChange('api', 'apiVersioning', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable API Versioning</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.api.documentationEnabled}
                    onChange={(e) => handleSettingChange('api', 'documentationEnabled', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Enable API Documentation</span>
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleSave('api')}
                  disabled={saving}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save API Settings'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
