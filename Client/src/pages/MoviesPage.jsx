/**
 * MoviesPage - Browse all movies with search and filter
 * 
 * FEATURES:
 * - Full movie catalog
 * - Search by title or IMDB ID
 * - Filter by genre
 * - Responsive grid layout
 */

import { useEffect } from 'react';
import { useMovies } from '../hooks';
import { MovieGrid, SearchBar } from '../components';

export default function MoviesPage() {
  const {
    filteredMovies,
    loading,
    searchTerm,
    selectedGenre,
    availableGenres,
    fetchMovies,
    setSearchTerm,
    setSelectedGenre,
    clearFilters,
  } = useMovies();

  useEffect(() => {
    fetchMovies();
  }, [fetchMovies]);

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-black">
          Movie Collection
        </h1>
        <p className="text-gray-600 font-medium mt-2">
          Browse our curated selection of must-watch films
        </p>
      </div>

      {/* Search and Filter */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        genres={availableGenres}
        onClear={clearFilters}
      />

      {/* Results Count */}
      <div className="mb-4 font-bold">
        {filteredMovies.length} movie{filteredMovies.length !== 1 ? 's' : ''} found
      </div>

      {/* Movie Grid */}
      <MovieGrid
        movies={filteredMovies}
        loading={loading}
        emptyMessage={
          searchTerm || selectedGenre
            ? 'No movies match your filters'
            : 'No movies available yet'
        }
      />
    </div>
  );
}
