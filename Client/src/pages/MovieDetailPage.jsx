/**
 * MovieDetailPage - Single movie view with trailer
 * 
 * FEATURES:
 * - Full movie details
 * - Embedded YouTube trailer
 * - Admin review display
 * - Responsive layout
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useMovies, useAuth } from '../hooks';
import { LoadingSpinner } from '../components';

export default function MovieDetailPage() {
  const { imdbId } = useParams();
  const navigate = useNavigate();
  const { selectedMovie, loading, fetchMovie, setSelectedMovie } = useMovies();
  const { isAdmin } = useAuth();
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (imdbId) {
      fetchMovie(imdbId);
    }
    
    // Cleanup on unmount
    return () => setSelectedMovie(null);
  }, [imdbId, fetchMovie, setSelectedMovie]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!selectedMovie) {
    return (
      <div className="brutal-card p-8 text-center max-w-md mx-auto mt-20">
        <div className="text-6xl mb-4">🎬</div>
        <h2 className="font-black text-2xl mb-2">Movie Not Found</h2>
        <p className="text-gray-600 mb-6">
          The movie you're looking for doesn't exist.
        </p>
        <button
          onClick={() => navigate('/movies')}
          className="brutal-btn bg-[var(--color-primary)] text-white"
        >
          Back to Movies
        </button>
      </div>
    );
  }

  const fallbackImage = `https://via.placeholder.com/400x600/FEF9EF/000000?text=${encodeURIComponent(selectedMovie.title)}`;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="brutal-btn bg-white mb-6 inline-flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="brutal-card bg-white overflow-hidden">
        <div className="grid md:grid-cols-[350px_1fr] gap-0">
          {/* Poster */}
          <div className="relative">
            <img
              src={imageError ? fallbackImage : selectedMovie.poster_path}
              alt={selectedMovie.title}
              onError={() => setImageError(true)}
              className="w-full h-full object-cover min-h-[400px] md:min-h-full"
            />
            
            {/* Ranking Badge */}
            {selectedMovie.ranking?.ranking_value < 999 && (
              <div className="absolute top-4 left-4 bg-[var(--color-accent)] px-4 py-2 border-3 border-black brutal-shadow">
                <span className="font-black text-2xl">
                  #{selectedMovie.ranking.ranking_value}
                </span>
                <span className="block text-sm font-bold">
                  {selectedMovie.ranking.ranking_name}
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-6 md:p-8 border-t-3 md:border-t-0 md:border-l-3 border-black">
            <h1 className="text-3xl md:text-4xl font-black leading-tight">
              {selectedMovie.title}
            </h1>
            
            <p className="text-gray-600 font-bold mt-2">
              IMDB: {selectedMovie.imdb_id}
            </p>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedMovie.genre?.map((g) => (
                <span
                  key={g.genre_id}
                  className="bg-[var(--color-secondary)] px-3 py-1 border-2 border-black font-bold text-sm"
                >
                  {g.genre_name}
                </span>
              ))}
            </div>

            {/* Admin Review */}
            {selectedMovie.admin_review && (
              <div className="mt-6 p-4 bg-[var(--color-bg)] border-3 border-black">
                <h3 className="font-black text-lg mb-2 flex items-center gap-2">
                  <span className="text-2xl">📝</span>
                  Curator's Review
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {selectedMovie.admin_review}
                </p>
              </div>
            )}

            {/* YouTube Trailer */}
            {selectedMovie.youtube_id && (
              <div className="mt-6">
                <h3 className="font-black text-lg mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎬</span>
                  Watch Trailer
                </h3>
                <div className="relative aspect-video border-3 border-black brutal-shadow">
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedMovie.youtube_id}`}
                    title={`${selectedMovie.title} Trailer`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* IMDB Link */}
            <div className="mt-6">
              <a
                href={`https://www.imdb.com/title/${selectedMovie.imdb_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="brutal-btn bg-[var(--color-accent)] inline-flex items-center gap-2"
              >
                View on IMDB
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {/* Admin Actions */}
            {isAdmin && (
              <div className="mt-8 pt-6 border-t-3 border-black">
                <p className="text-sm font-bold text-gray-600 mb-2">Admin Actions</p>
                <Link
                  to={`/admin/review/${selectedMovie.imdb_id}`}
                  className="brutal-btn bg-[var(--color-purple)] text-white"
                >
                  Edit Review
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
