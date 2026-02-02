/**
 * Genres API Service
 */

import apiClient from './client';

export const genresApi = {
  /**
   * Get all available genres (public)
   * Used in registration form for selecting favorite genres
   */
  getAll: async () => {
    const response = await apiClient.get('/genres');
    return response.data;
  },
};
