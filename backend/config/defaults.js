const createPermissionTemplate = () => ({
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
});

const defaultPermissionsByRole = {
  Admin: {
    canCreateRecords: true,
    canEditOwnRecords: true,
    canDeleteOwnRecords: true,
    canViewAllRecords: true,
    canEditAllRecords: true,
    canDeleteAllRecords: true,
    canManageUsers: true,
    canManageRoles: true,
    canApproveRequests: true,
    canManageSettings: true
  },
  'Finance Manager': {
    canCreateRecords: true,
    canEditOwnRecords: true,
    canDeleteOwnRecords: true,
    canViewAllRecords: true,
    canEditAllRecords: true,
    canDeleteAllRecords: false,
    canManageUsers: false,
    canManageRoles: false,
    canApproveRequests: true,
    canManageSettings: false
  },
  Analyst: {
    canCreateRecords: false,
    canEditOwnRecords: false,
    canDeleteOwnRecords: false,
    canViewAllRecords: true,
    canEditAllRecords: false,
    canDeleteAllRecords: false,
    canManageUsers: false,
    canManageRoles: false,
    canApproveRequests: false,
    canManageSettings: false
  },
  Employee: {
    canCreateRecords: true,
    canEditOwnRecords: true,
    canDeleteOwnRecords: false,
    canViewAllRecords: false,
    canEditAllRecords: false,
    canDeleteAllRecords: false,
    canManageUsers: false,
    canManageRoles: false,
    canApproveRequests: false,
    canManageSettings: false
  },
  User: {
    canCreateRecords: true,
    canEditOwnRecords: true,
    canDeleteOwnRecords: false,
    canViewAllRecords: false,
    canEditAllRecords: false,
    canDeleteAllRecords: false,
    canManageUsers: false,
    canManageRoles: false,
    canApproveRequests: false,
    canManageSettings: false
  },
  Viewer: {
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
};

const getDefaultPermissions = (roleName = '') => ({
  ...createPermissionTemplate(),
  ...(defaultPermissionsByRole[roleName] || {})
});

const getDefaultUserPreferences = () => ({
  emailNotifications: true,
  smsNotifications: false,
  dashboardTheme: 'light',
  currency: 'INR',
  dateFormat: 'DD/MM/YYYY',
  language: 'en'
});

const getDefaultAppSettings = () => ({
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
    includeFiles: true,
    lastBackupAt: new Date().toISOString()
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

const getAllowedPermissions = () => Object.keys(createPermissionTemplate());

module.exports = {
  getAllowedPermissions,
  getDefaultAppSettings,
  getDefaultPermissions,
  getDefaultUserPreferences
};
