/**
 * Movies State Atoms
 * Manages movie-related global state
 */

import { atom } from 'jotai';

/**
 * All movies list
 */
export const moviesAtom = atom([]);

/**
 * Movies loading state
 */
export const moviesLoadingAtom = atom(false);

/**
 * Movies error state
 */
export const moviesErrorAtom = atom(null);

/**
 * Recommended movies for current user
 */
export const recommendedMoviesAtom = atom([]);

/**
 * Currently selected movie (for detail view)
 */
export const selectedMovieAtom = atom(null);

/**
 * Search/filter term for movies
 */
export const movieSearchTermAtom = atom('');

/**
 * Selected genre filter
 */
export const selectedGenreFilterAtom = atom(null);

/**
 * Derived atom: Filtered movies based on search and genre
 */
export const filteredMoviesAtom = atom((get) => {
  const movies = get(moviesAtom);
  const searchTerm = get(movieSearchTermAtom).toLowerCase();
  const selectedGenre = get(selectedGenreFilterAtom);

  return movies.filter((movie) => {
    const matchesSearch = 
      movie.title.toLowerCase().includes(searchTerm) ||
      movie.imdb_id.toLowerCase().includes(searchTerm);
    
    const matchesGenre = 
      !selectedGenre || 
      movie.genre?.some((g) => g.genre_name === selectedGenre);

    return matchesSearch && matchesGenre;
  });
});

/**
 * Derived atom: Get unique genres from all movies
 */
export const availableGenresAtom = atom((get) => {
  const movies = get(moviesAtom);
  const genreSet = new Set();
  
  movies.forEach((movie) => {
    movie.genre?.forEach((g) => genreSet.add(g.genre_name));
  });
  
  return Array.from(genreSet).sort();
});
