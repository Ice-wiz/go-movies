/**
 * GenreSelector Component - Multi-select for favorite genres
 * 
 * UX FEATURES:
 * - Visual feedback for selected items
 * - Keyboard accessible
 * - Shows selection count
 * - Animated selection state
 */

export default function GenreSelector({
  genres = [],
  selectedGenres = [],
  onChange,
  loading = false,
  error = null,
  maxSelections = 5,
}) {
  const handleToggle = (genre) => {
    const isSelected = selectedGenres.some((g) => g.genre_id === genre.genre_id);
    
    if (isSelected) {
      // Remove genre
      onChange(selectedGenres.filter((g) => g.genre_id !== genre.genre_id));
    } else if (selectedGenres.length < maxSelections) {
      // Add genre
      onChange([...selectedGenres, genre]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="brutal-skeleton h-12 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="brutal-card p-4 bg-[var(--color-primary)] text-white">
        <p className="font-bold">Failed to load genres</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold">Select your favorite genres</span>
        <span className={`text-sm font-medium ${
          selectedGenres.length >= maxSelections ? 'text-[var(--color-primary)]' : 'text-gray-600'
        }`}>
          {selectedGenres.length}/{maxSelections} selected
        </span>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {genres.map((genre) => {
          const isSelected = selectedGenres.some(
            (g) => g.genre_id === genre.genre_id
          );
          const isDisabled = !isSelected && selectedGenres.length >= maxSelections;

          return (
            <button
              key={genre.genre_id}
              type="button"
              onClick={() => handleToggle(genre)}
              disabled={isDisabled}
              className={`p-3 font-bold text-left transition-all border-3 ${
                isSelected
                  ? 'bg-[var(--color-secondary)] border-black brutal-shadow'
                  : isDisabled
                  ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
                  : 'bg-white border-black hover:bg-gray-100 hover:brutal-shadow'
              }`}
              aria-pressed={isSelected}
            >
              <span className="flex items-center gap-2">
                {isSelected && (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
                {genre.genre_name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
