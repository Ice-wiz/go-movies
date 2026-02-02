/**
 * MovieGrid Component - Responsive grid layout for movies
 * 
 * RESPONSIVE DESIGN:
 * - 1 column on mobile
 * - 2 columns on small tablets
 * - 3 columns on tablets
 * - 4 columns on desktop
 * - 5 columns on large screens
 */

import MovieCard from './MovieCard';
import LoadingSpinner from './LoadingSpinner';

export default function MovieGrid({ 
  movies, 
  loading = false, 
  emptyMessage = 'No movies found',
  showRanking = true 
}) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <div className="brutal-card p-8 text-center bg-white">
        <div className="text-6xl mb-4">🎬</div>
        <p className="font-bold text-xl">{emptyMessage}</p>
        <p className="text-gray-600 mt-2">Check back later for updates!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {movies.map((movie) => (
        <MovieCard 
          key={movie.imdb_id || movie._id} 
          movie={movie} 
          showRanking={showRanking}
        />
      ))}
    </div>
  );
}
