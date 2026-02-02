/**
 * API Client - Centralized HTTP client with interceptors
 * 
 * KEY CONCEPTS:
 * 1. Request/Response Interceptors: Automatically handle auth headers and errors
 * 2. Token Refresh: Seamlessly refreshes expired tokens
 * 3. Error Normalization: Consistent error format across the app
 * 4. Credentials: Include cookies for HTTP-only token storage
 */

import axios from 'axios';

// Base API configuration
const apiClient = axios.create({
  baseURL: '/api', // Uses Vite proxy in development
  timeout: 10000,
  withCredentials: true, // CRUCIAL: Sends cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing to prevent infinite loops
let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh
 * This prevents multiple simultaneous refresh attempts
 */
const processQueue = (error = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

/**
 * Response Interceptor
 * Handles 401 errors by attempting token refresh
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't retry refresh endpoint itself
      if (originalRequest.url === '/refresh') {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await apiClient.post('/refresh');
        processQueue();
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Dispatch custom event for auth state management
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Normalize error response
    const normalizedError = {
      message: error.response?.data?.error || error.message || 'An error occurred',
      status: error.response?.status,
      details: error.response?.data?.details,
    };

    return Promise.reject(normalizedError);
  }
);

export default apiClient;
