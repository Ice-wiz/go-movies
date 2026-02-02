/**
 * ProfilePage - User profile view
 * 
 * FEATURES:
 * - Display user info
 * - Show favorite genres
 * - Account actions
 */

import { useAuth } from '../hooks';
import { ProtectedRoute } from '../components';

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();

  return (
    <ProtectedRoute>
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <div className="brutal-card bg-[var(--color-secondary)] p-6 md:p-8 mb-6">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 md:w-24 md:h-24 bg-white border-3 border-black brutal-shadow flex items-center justify-center">
              <span className="text-3xl md:text-4xl font-black">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            
            <div>
              <h1 className="text-2xl md:text-3xl font-black">
                {user?.first_name} {user?.last_name}
              </h1>
              <p className="text-gray-700 font-medium">{user?.email}</p>
              {user?.role === 'ADMIN' && (
                <span className="inline-block mt-2 bg-[var(--color-purple)] text-white px-3 py-1 border-2 border-black font-bold text-sm">
                  Admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Favorite Genres */}
        <div className="brutal-card bg-white p-6 md:p-8 mb-6">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="text-2xl">🎬</span>
            Your Favorite Genres
          </h2>
          
          {user?.favourite_genres && user.favourite_genres.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {user.favourite_genres.map((genre) => (
                <span
                  key={genre.genre_id}
                  className="bg-[var(--color-accent)] px-4 py-2 border-3 border-black brutal-shadow font-bold"
                >
                  {genre.genre_name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No favorite genres selected yet.</p>
          )}
        </div>

        {/* Account Info */}
        <div className="brutal-card bg-white p-6 md:p-8 mb-6">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Account Details
          </h2>
          
          <dl className="space-y-3">
            <div className="flex justify-between py-2 border-b-2 border-gray-200">
              <dt className="font-bold">User ID</dt>
              <dd className="text-gray-600 font-mono text-sm">{user?.user_id}</dd>
            </div>
            <div className="flex justify-between py-2 border-b-2 border-gray-200">
              <dt className="font-bold">Role</dt>
              <dd className="text-gray-600">{user?.role}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="font-bold">Status</dt>
              <dd className="text-green-600 font-bold">Active</dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="brutal-card bg-white p-6 md:p-8">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            <span className="text-2xl">⚙️</span>
            Account Actions
          </h2>
          
          <div className="space-y-4">
            <button
              onClick={logout}
              disabled={loading}
              className="w-full brutal-btn bg-[var(--color-primary)] text-white disabled:opacity-50"
            >
              {loading ? 'Logging out...' : 'Logout'}
            </button>
            
            <p className="text-center text-gray-500 text-sm">
              Need to update your profile? Contact support.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
