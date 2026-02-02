/**
 * LoginPage - User authentication
 * 
 * FORM HANDLING:
 * - Client-side validation before submission
 * - Loading states during API call
 * - Error display with clear messaging
 * - Remember redirect destination
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';
import { FormInput } from '../components';

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth();
  const location = useLocation();
  const from = location.state?.from || '/';

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // Clear API error
    if (error) {
      clearError();
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      await login(formData);
      // Navigation handled by useAuth hook
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 md:mt-16">
      <div className="brutal-card p-6 md:p-8 bg-white">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black">Welcome Back</h1>
          <p className="text-gray-600 mt-2">
            Sign in to access your personalized picks
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <FormInput
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            placeholder="your@email.com"
            required
            autoComplete="email"
          />

          <FormInput
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            placeholder="Enter your password"
            required
            autoComplete="current-password"
          />

          {/* API Error */}
          {error && (
            <div className="p-4 bg-[var(--color-primary)] text-white border-3 border-black animate-shake">
              <p className="font-bold">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full brutal-btn bg-[var(--color-primary)] text-white text-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white border-t-transparent animate-spin" />
                Signing in...
              </span>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-6 border-t-3 border-black text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="font-bold text-[var(--color-primary)] hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Decorative element */}
      <div className="mt-8 text-center">
        <span className="inline-block bg-[var(--color-accent)] px-4 py-2 border-3 border-black brutal-shadow font-bold">
          🎬 Start watching today!
        </span>
      </div>
    </div>
  );
}
