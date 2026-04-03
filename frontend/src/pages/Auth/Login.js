import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoginError, setHasLoginError] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const { login, clearError, error } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setHasLoginError(false);
    setLoginSuccess(false);

    try {
      const result = await login(formData);
      setLoginSuccess(true);

      // Add delay before navigation to prevent immediate reload
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 15000);

    } catch (error) {
      setHasLoginError(true);
      setLoginSuccess(false);
      // Don't navigate on error, just show the error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-8 w-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>

        {/* Success Display */}
        {loginSuccess && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Login Successful! </strong>
            <span className="block sm:inline">Redirecting to dashboard in 15 seconds...</span>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Login Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button
              onClick={() => clearError()}
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
            >
              <span className="text-red-500 hover:text-red-700">×</span>
            </button>
          </div>
        )}

        {/* Debug Info */}
        <div className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded text-xs">
          <div><strong>Debug Info:</strong></div>
          <div>Email: {formData.email}</div>
          <div>Password: {formData.password ? '***' : 'empty'}</div>
          <div>Submitting: {isSubmitting ? 'Yes' : 'No'}</div>
          <div>Login Error: {hasLoginError ? 'Yes' : 'No'}</div>
          <div>Login Success: {loginSuccess ? 'Yes' : 'No'}</div>
          <div>Error: {error || 'None'}</div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${errors.email ? 'border-error-500' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && <p className="form-error">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${errors.password ? 'border-error-500' : ''}`}
                placeholder="Enter your password"
              />
              {errors.password && <p className="form-error">{errors.password}</p>}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || hasLoginError}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="loading-spinner h-5 w-5"></div>
              ) : hasLoginError ? (
                'Login Failed - Check Error Above'
              ) : loginSuccess ? (
                'Login Successful - Redirecting...'
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Demo Credentials</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium">Admin:</p>
              <p>Email: admin@finance.com</p>
              <p>Password: admin123456</p>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link
              to="/change-password"
              className="font-medium text-blue-600 hover:text-blue-500 text-sm"
            >
              Change Password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
