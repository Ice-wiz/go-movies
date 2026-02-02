/**
 * useGenres Hook - Genre Operations
 */

import { useState, useCallback } from 'react';
import { genresApi } from '../api';

export function useGenres() {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Fetch all available genres
   */
  const fetchGenres = useCallback(async () => {
    if (genres.length > 0) return genres;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await genresApi.getAll();
      setGenres(data || []);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch genres');
      return [];
    } finally {
      setLoading(false);
    }
  }, [genres.length]);

  return {
    genres,
    loading,
    error,
    fetchGenres,
  };
}
