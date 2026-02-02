/**
 * Authentication API Service
 * Handles all auth-related API calls
 */

import apiClient from './client';

export const authApi = {
  /**
   * Register a new user
   * @param {Object} userData - { first_name, last_name, email, password, favourite_genres }
   */
  register: async (userData) => {
    const response = await apiClient.post('/register', userData);
    return response.data;
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  login: async (credentials) => {
    const response = await apiClient.post('/login', credentials);
    return response.data;
  },

  /**
   * Logout user - clears cookies server-side
   */
  logout: async () => {
    const response = await apiClient.post('/logout');
    return response.data;
  },

  /**
   * Refresh access token using refresh token cookie
   */
  refresh: async () => {
    const response = await apiClient.post('/refresh');
    return response.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await apiClient.get('/profile');
    return response.data;
  },
};
