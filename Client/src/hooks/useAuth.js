/**
 * useAuth Hook - Authentication Operations
 * 
 * KEY CONCEPTS:
 * 1. Custom Hooks: Encapsulate reusable stateful logic
 * 2. Separation of Concerns: Hook handles logic, components handle UI
 * 3. Error Handling: Centralized error management for auth operations
 * 4. Side Effects: Properly managed with cleanup
 * 
 * ROBUSTNESS FEATURES:
 * - Automatic logout on session expiry (via event listener)
 * - Loading states prevent double-submission
 * - Error normalization for consistent UX
 */

import { useCallback, useEffect } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../api';
import { 
  userAtom, 
  authLoadingAtom, 
  authErrorAtom 
} from '../atoms';

export function useAuth() {
  const [user, setUser] = useAtom(userAtom);
  const [loading, setLoading] = useAtom(authLoadingAtom);
  const [error, setError] = useAtom(authErrorAtom);
  const navigate = useNavigate();

  /**
   * Handle forced logout (e.g., token expiry)
   * Uses custom event from API client
   */
  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      toast.error('Session expired. Please login again.');
      navigate('/login');
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, [setUser, navigate]);

  /**
   * Register new user
   * @param {Object} userData - Registration form data
   */
  const register = useCallback(async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.register(userData);
      setUser(response.user);
      toast.success('Registration successful! Welcome aboard!');
      navigate('/');
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, setError, navigate]);

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  const login = useCallback(async (credentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
      toast.success(`Welcome back, ${response.user.first_name}!`);
      navigate('/');
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, setError, navigate]);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    setLoading(true);
    
    try {
      await authApi.logout();
      setUser(null);
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (err) {
      // Still clear user on error - they wanted to logout
      setUser(null);
      navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, navigate]);

  /**
   * Fetch current user profile
   * Used to verify auth state on app load
   */
  const fetchProfile = useCallback(async () => {
    try {
      const response = await authApi.getProfile();
      setUser(response.user);
      return response.user;
    } catch (err) {
      // Silently fail - user just isn't authenticated
      setUser(null);
      return null;
    }
  }, [setUser]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    register,
    login,
    logout,
    fetchProfile,
    clearError,
  };
}
