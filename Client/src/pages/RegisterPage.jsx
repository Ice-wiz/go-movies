/**
 * RegisterPage - New user registration
 * 
 * MULTI-STEP APPROACH:
 * - Basic info first
 * - Genre selection second
 * - Clear progress indication
 * - Comprehensive validation
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, useGenres } from '../hooks';
import { FormInput, GenreSelector } from '../components';

export default function RegisterPage() {
  const { register, loading, error, clearError } = useAuth();
  const { genres, fetchGenres, loading: genresLoading } = useGenres();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    favourite_genres: [],
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch genres on mount
  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (error) {
      clearError();
    }
  };

  const handleGenreChange = (selectedGenres) => {
    setFormData((prev) => ({ ...prev, favourite_genres: selectedGenres }));
    if (formErrors.favourite_genres) {
      setFormErrors((prev) => ({ ...prev, favourite_genres: '' }));
    }
  };

  const validateStep1 = () => {
    const errors = {};
    
    if (!formData.first_name.trim()) {
      errors.first_name = 'First name is required';
    } else if (formData.first_name.length < 2) {
      errors.first_name = 'First name must be at least 2 characters';
    }
    
    if (!formData.last_name.trim()) {
      errors.last_name = 'Last name is required';
    } else if (formData.last_name.length < 2) {
      errors.last_name = 'Last name must be at least 2 characters';
    }
    
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
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    const errors = {};
    
    if (formData.favourite_genres.length === 0) {
      errors.favourite_genres = 'Please select at least one genre';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep2()) return;
    
    try {
      const { confirmPassword, ...submitData } = formData;
      await register(submitData);
    } catch (err) {
      // Error handled by useAuth hook
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8 md:mt-12">
      <div className="brutal-card p-6 md:p-8 bg-white">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-black">Create Account</h1>
          <p className="text-gray-600 mt-2">
            Join MagicStream for personalized recommendations
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className={`w-10 h-10 flex items-center justify-center font-bold border-3 border-black ${
              step >= 1 ? 'bg-[var(--color-secondary)]' : 'bg-gray-200'
            }`}
          >
            1
          </div>
          <div className="w-12 h-1 bg-black" />
          <div
            className={`w-10 h-10 flex items-center justify-center font-bold border-3 border-black ${
              step >= 2 ? 'bg-[var(--color-secondary)]' : 'bg-gray-200'
            }`}
          >
            2
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  error={formErrors.first_name}
                  placeholder="John"
                  required
                  autoComplete="given-name"
                />
                
                <FormInput
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  error={formErrors.last_name}
                  placeholder="Doe"
                  required
                  autoComplete="family-name"
                />
              </div>

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
                placeholder="At least 6 characters"
                required
                autoComplete="new-password"
              />

              <FormInput
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={formErrors.confirmPassword}
                placeholder="Repeat your password"
                required
                autoComplete="new-password"
              />

              <button
                type="button"
                onClick={handleNext}
                className="w-full brutal-btn bg-[var(--color-secondary)] text-lg"
              >
                Next: Choose Genres
              </button>
            </div>
          )}

          {/* Step 2: Genre Selection */}
          {step === 2 && (
            <div className="space-y-5">
              <GenreSelector
                genres={genres}
                selectedGenres={formData.favourite_genres}
                onChange={handleGenreChange}
                loading={genresLoading}
                maxSelections={5}
              />

              {formErrors.favourite_genres && (
                <p className="text-[var(--color-primary)] font-bold text-sm">
                  {formErrors.favourite_genres}
                </p>
              )}

              {/* API Error */}
              {error && (
                <div className="p-4 bg-[var(--color-primary)] text-white border-3 border-black animate-shake">
                  <p className="font-bold">{error}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 brutal-btn bg-gray-200"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 brutal-btn bg-[var(--color-primary)] text-white disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent animate-spin" />
                      Creating...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Footer Links */}
        <div className="mt-6 pt-6 border-t-3 border-black text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-bold text-[var(--color-primary)] hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
