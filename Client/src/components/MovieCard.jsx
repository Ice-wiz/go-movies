/**
 * MovieCard Component - Displays movie in grid
 * 
 * UX FEATURES:
 * - Lazy loading images with fallback
 * - Hover effects for interactivity feedback
 * - Accessible with keyboard navigation
 * - Responsive sizing
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';

// Ranking badge colors based on value
const getRankingStyle = (value) => {
  if (value <= 3) return 'bg-[var(--color-green)]';
  if (value <= 6) return 'bg-[var(--color-accent)]';
  if (value <= 9) return 'bg-[var(--color-orange)]';
  return 'bg-gray-400';
};

export default function MovieCard({ movie, showRanking = true }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const fallbackImage = `https://via.placeholder.com/300x450/FEF9EF/000000?text=${encodeURIComponent(movie.title)}`;

  return (
    <Link
      to={`/movie/${movie.imdb_id}`}
      className="group block brutal-card overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-[8px_8px_0px_0px_#000] focus:outline-none focus:-translate-y-1 focus:shadow-[8px_8px_0px_0px_#000]"
      aria-label={`View details for ${movie.title}`}
    >
      {/* Image Container */}
      <div className="relative aspect-[2/3] overflow-hidden bg-gray-200">
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 brutal-skeleton" />
        )}
        
        <img
          src={imageError ? fallbackImage : movie.poster_path}
          alt={movie.title}
          loading="lazy"
          onError={() => setImageError(true)}
          onLoad={() => setImageLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Ranking Badge */}
        {showRanking && movie.ranking && movie.ranking.ranking_value < 999 && (
          <div
            className={`absolute top-2 right-2 px-3 py-1 border-3 border-black font-black text-sm ${getRankingStyle(
              movie.ranking.ranking_value
            )}`}
          >
            #{movie.ranking.ranking_value}
          </div>
        )}

        {/* Genre Tags Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex flex-wrap gap-1">
            {movie.genre?.slice(0, 2).map((g) => (
              <span
                key={g.genre_id}
                className="text-xs font-bold text-white bg-black/50 px-2 py-0.5"
              >
                {g.genre_name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-white">
        <h3 className="font-black text-lg leading-tight line-clamp-2 group-hover:text-[var(--color-primary)] transition-colors">
          {movie.title}
        </h3>
        
        <p className="text-sm text-gray-600 mt-1 font-medium">
          {movie.imdb_id}
        </p>

        {/* Ranking Name */}
        {movie.ranking?.ranking_name && movie.ranking.ranking_name !== 'Unrated' && (
          <p className="text-sm font-bold text-[var(--color-purple)] mt-2">
            {movie.ranking.ranking_name}
          </p>
        )}
      </div>
    </Link>
  );
}
