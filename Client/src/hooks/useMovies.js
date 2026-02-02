/**
 * useMovies Hook - Movie Operations
 * 
 * OPTIMIZATION FEATURES:
 * - Caching: Prevents unnecessary refetches
 * - Optimistic Updates: Better perceived performance
 * - Error Recovery: Graceful degradation
 */

import { useCallback } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import toast from 'react-hot-toast';
import { moviesApi } from '../api';
import {
  moviesAtom,
  moviesLoadingAtom,
  moviesErrorAtom,
  recommendedMoviesAtom,
  selectedMovieAtom,
  filteredMoviesAtom,
  availableGenresAtom,
  movieSearchTermAtom,
  selectedGenreFilterAtom,
} from '../atoms';

export function useMovies() {
  const [movies, setMovies] = useAtom(moviesAtom);
  const [loading, setLoading] = useAtom(moviesLoadingAtom);
  const [error, setError] = useAtom(moviesErrorAtom);
  const [recommendedMovies, setRecommendedMovies] = useAtom(recommendedMoviesAtom);
  const [selectedMovie, setSelectedMovie] = useAtom(selectedMovieAtom);
  const [searchTerm, setSearchTerm] = useAtom(movieSearchTermAtom);
  const [selectedGenre, setSelectedGenre] = useAtom(selectedGenreFilterAtom);
  
  // Read-only derived atoms
  const filteredMovies = useAtomValue(filteredMoviesAtom);
  const availableGenres = useAtomValue(availableGenresAtom);

  /**
   * Fetch all movies
   * @param {boolean} force - Force refetch even if cached
   */
  const fetchMovies = useCallback(async (force = false) => {
    // Skip if already loaded and not forcing
    if (movies.length > 0 && !force) return movies;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await moviesApi.getAll();
      setMovies(data || []);
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch movies';
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [movies.length, setMovies, setLoading, setError]);

  /**
   * Fetch single movie by IMDB ID
   */
  const fetchMovie = useCallback(async (imdbId) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await moviesApi.getById(imdbId);
      setSelectedMovie(data);
      return data;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch movie';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setSelectedMovie, setLoading, setError]);

  /**
   * Fetch recommended movies for current user
   */
  const fetchRecommended = useCallback(async () => {
    try {
      const data = await moviesApi.getRecommended();
      setRecommendedMovies(data || []);
      return data;
    } catch (err) {
      // Silently fail - recommendations are optional
      setRecommendedMovies([]);
      return [];
    }
  }, [setRecommendedMovies]);

  /**
   * Add a new movie
   */
  const addMovie = useCallback(async (movieData) => {
    setLoading(true);
    
    try {
      const response = await moviesApi.add(movieData);
      toast.success('Movie added successfully!');
      // Refetch to get updated list
      await fetchMovies(true);
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to add movie';
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setLoading, fetchMovies]);

  /**
   * Update movie review (admin only)
   */
  const updateReview = useCallback(async (imdbId, reviewData) => {
    try {
      const response = await moviesApi.updateReview(imdbId, reviewData);
      toast.success('Review updated successfully!');
      // Update local state
      setMovies((prev) =>
        prev.map((m) =>
          m.imdb_id === imdbId
            ? { ...m, admin_review: reviewData.admin_review, ranking: reviewData.ranking }
            : m
        )
      );
      return response;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update review';
      toast.error(errorMessage);
      throw err;
    }
  }, [setMovies]);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedGenre(null);
  }, [setSearchTerm, setSelectedGenre]);

  return {
    // State
    movies,
    filteredMovies,
    recommendedMovies,
    selectedMovie,
    loading,
    error,
    searchTerm,
    selectedGenre,
    availableGenres,
    
    // Actions
    fetchMovies,
    fetchMovie,
    fetchRecommended,
    addMovie,
    updateReview,
    setSearchTerm,
    setSelectedGenre,
    clearFilters,
    setSelectedMovie,
  };
}
