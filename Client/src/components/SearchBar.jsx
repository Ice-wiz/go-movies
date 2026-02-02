/**
 * SearchBar Component - Movie search and filter
 * 
 * UX FEATURES:
 * - Debounced input to prevent excessive API calls
 * - Clear button for quick reset
 * - Genre filter dropdown
 * - Responsive layout
 */

import { useEffect, useState, useCallback } from 'react';

export default function SearchBar({
  searchTerm,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  genres = [],
  onClear,
}) {
  const [localSearch, setLocalSearch] = useState(searchTerm);

  // Debounce search input - waits 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Sync with external state
  useEffect(() => {
    setLocalSearch(searchTerm);
  }, [searchTerm]);

  const handleClear = useCallback(() => {
    setLocalSearch('');
    onClear();
  }, [onClear]);

  const hasFilters = searchTerm || selectedGenre;

  return (
    <div className="brutal-card p-4 mb-6 bg-white">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search movies by title or IMDB ID..."
            className="brutal-input pl-10"
            aria-label="Search movies"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Genre Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedGenre || ''}
            onChange={(e) => onGenreChange(e.target.value || null)}
            className="brutal-input cursor-pointer"
            aria-label="Filter by genre"
          >
            <option value="">All Genres</option>
            {genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasFilters && (
          <button
            onClick={handleClear}
            className="brutal-btn bg-gray-200 hover:bg-gray-300 whitespace-nowrap"
            aria-label="Clear all filters"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t-3 border-black">
          <span className="font-bold">Active filters:</span>
          {searchTerm && (
            <span className="bg-[var(--color-accent)] px-3 py-1 border-2 border-black font-medium">
              "{searchTerm}"
            </span>
          )}
          {selectedGenre && (
            <span className="bg-[var(--color-secondary)] px-3 py-1 border-2 border-black font-medium">
              {selectedGenre}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
