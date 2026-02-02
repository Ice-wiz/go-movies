/**
 * Movies API Service
 * Handles all movie-related API calls
 */

import apiClient from './client';

export const moviesApi = {
  /**
   * Get all movies (public endpoint)
   */
  getAll: async () => {
    const response = await apiClient.get('/movies');
    return response.data;
  },

  /**
   * Get a single movie by IMDB ID (protected)
   * @param {string} imdbId - The IMDB ID of the movie
   */
  getById: async (imdbId) => {
    const response = await apiClient.get(`/movie/${imdbId}`);
    return response.data;
  },

  /**
   * Get recommended movies based on user's favorite genres (protected)
   */
  getRecommended: async () => {
    const response = await apiClient.get('/recommendedmovies');
    return response.data;
  },

  /**
   * Add a new movie (protected, admin only in production)
   * @param {Object} movieData - Movie data object
   */
  add: async (movieData) => {
    const response = await apiClient.post('/addmovie', movieData);
    return response.data;
  },

  /**
   * Update movie review and ranking (admin only)
   * @param {string} imdbId - The IMDB ID of the movie
   * @param {Object} reviewData - { admin_review, ranking }
   */
  updateReview: async (imdbId, reviewData) => {
    const response = await apiClient.patch(`/updatereview/${imdbId}`, reviewData);
    return response.data;
  },
};
