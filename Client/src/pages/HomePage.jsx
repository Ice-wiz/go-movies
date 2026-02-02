/**
 * HomePage - Landing page with featured content
 * 
 * CONTENT STRATEGY:
 * - Hero section for first impression
 * - Featured movies showcase
 * - Quick access to recommended (if authenticated)
 * - Call-to-action for unauthenticated users
 */

import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { useMovies, useAuth } from '../hooks';
import { MovieGrid, LoadingSpinner } from '../components';
import { isAuthenticatedAtom } from '../atoms';

export default function HomePage() {
  const { movies, recommendedMovies, loading, fetchMovies, fetchRecommended } = useMovies();
  const { user } = useAuth();
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);

  useEffect(() => {
    fetchMovies();
    if (isAuthenticated) {
      fetchRecommended();
    }
  }, [fetchMovies, fetchRecommended, isAuthenticated]);

  // Get top ranked movies for hero section
  const featuredMovies = movies
    .filter((m) => m.ranking?.ranking_value < 999)
    .sort((a, b) => a.ranking.ranking_value - b.ranking.ranking_value)
    .slice(0, 5);

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="relative">
        <div className="brutal-card bg-[var(--color-primary)] p-8 md:p-12">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
              Your Personal
              <br />
              <span className="text-[var(--color-accent)]">Movie Curator</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-white/90 font-medium">
              Discover handpicked movies tailored to your taste. No algorithms, just pure cinema love.
            </p>
            
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to="/movies"
                className="brutal-btn bg-white text-black inline-block"
              >
                Browse Movies
              </Link>
              {!isAuthenticated && (
                <Link
                  to="/register"
                  className="brutal-btn bg-[var(--color-accent)] text-black inline-block"
                >
                  Get Personalized Picks
                </Link>
              )}
            </div>
          </div>
          
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 w-20 h-20 bg-[var(--color-accent)] border-3 border-black hidden md:block" />
          <div className="absolute bottom-4 right-20 w-12 h-12 bg-[var(--color-secondary)] border-3 border-black hidden md:block" />
        </div>
      </section>

      {/* Personalized Recommendations - Only for authenticated users */}
      {isAuthenticated && recommendedMovies.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black">
                For You, {user?.first_name}
              </h2>
              <p className="text-gray-600 font-medium">
                Based on your favorite genres
              </p>
            </div>
            <Link
              to="/recommended"
              className="brutal-btn bg-[var(--color-secondary)] text-sm"
            >
              See All
            </Link>
          </div>
          <MovieGrid movies={recommendedMovies.slice(0, 5)} loading={false} />
        </section>
      )}

      {/* Featured Movies */}
      {featuredMovies.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-black">
                Top Ranked
              </h2>
              <p className="text-gray-600 font-medium">
                Our curated best picks
              </p>
            </div>
          </div>
          <MovieGrid movies={featuredMovies} loading={false} />
        </section>
      )}

      {/* All Movies Preview */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black">
              Latest Additions
            </h2>
            <p className="text-gray-600 font-medium">
              Recently added to our collection
            </p>
          </div>
          <Link
            to="/movies"
            className="brutal-btn bg-white text-sm"
          >
            View All
          </Link>
        </div>
        <MovieGrid 
          movies={movies.slice(0, 10)} 
          loading={loading}
          showRanking={false}
        />
      </section>

      {/* CTA for unauthenticated users */}
      {!isAuthenticated && (
        <section className="brutal-card bg-[var(--color-accent)] p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-4xl font-black">
            Ready for personalized recommendations?
          </h2>
          <p className="mt-3 text-lg font-medium max-w-xl mx-auto">
            Create an account and tell us your favorite genres. We'll curate the perfect watchlist for you.
          </p>
          <div className="mt-6 flex justify-center gap-4 flex-wrap">
            <Link
              to="/register"
              className="brutal-btn bg-black text-white"
            >
              Create Account
            </Link>
            <Link
              to="/login"
              className="brutal-btn bg-white"
            >
              Sign In
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
