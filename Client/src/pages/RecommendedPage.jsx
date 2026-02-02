/**
 * RecommendedPage - Personalized movie recommendations
 * 
 * FEATURES:
 * - Based on user's favorite genres
 * - Sorted by ranking
 * - Clear messaging when no recommendations
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMovies, useAuth } from '../hooks';
import { MovieGrid, ProtectedRoute } from '../components';

export default function RecommendedPage() {
  const { recommendedMovies, loading, fetchRecommended } = useMovies();
  const { user } = useAuth();

  useEffect(() => {
    fetchRecommended();
  }, [fetchRecommended]);

  return (
    <ProtectedRoute>
      <div>
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black">
            Recommended For You
          </h1>
          <p className="text-gray-600 font-medium mt-2">
            Movies matching your taste in{' '}
            {user?.favourite_genres?.map((g) => g.genre_name).join(', ') || 'various genres'}
          </p>
        </div>

        {/* User's Favorite Genres */}
        {user?.favourite_genres && user.favourite_genres.length > 0 && (
          <div className="brutal-card p-4 mb-6 bg-[var(--color-accent)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold">Your favorite genres:</span>
              {user.favourite_genres.map((g) => (
                <span
                  key={g.genre_id}
                  className="bg-white px-3 py-1 border-2 border-black font-medium"
                >
                  {g.genre_name}
                </span>
              ))}
              <Link
                to="/profile"
                className="ml-auto text-sm font-bold underline hover:no-underline"
              >
                Update preferences
              </Link>
            </div>
          </div>
        )}

        {/* Recommendations Grid */}
        <MovieGrid
          movies={recommendedMovies}
          loading={loading}
          emptyMessage="No recommendations yet. Update your favorite genres in your profile!"
        />

        {/* No genres selected */}
        {(!user?.favourite_genres || user.favourite_genres.length === 0) && !loading && (
          <div className="brutal-card p-8 text-center bg-white mt-6">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="font-black text-xl mb-2">
              Help us help you!
            </h2>
            <p className="text-gray-600 mb-4">
              Select your favorite genres to get personalized movie recommendations.
            </p>
            <Link
              to="/profile"
              className="brutal-btn bg-[var(--color-secondary)] inline-block"
            >
              Update Preferences
            </Link>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
