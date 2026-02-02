/**
 * App Component - Main application entry with routing
 * 
 * ROUTING STRATEGY:
 * - Public routes accessible to all
 * - Protected routes require authentication
 * - Route-based code splitting (can be added with lazy imports)
 * 
 * AUTH INITIALIZATION:
 * - Check auth state on mount
 * - Handle session restoration
 */

import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Provider as JotaiProvider } from 'jotai';
import { Layout, ProtectedRoute } from './components';
import {
  HomePage,
  MoviesPage,
  MovieDetailPage,
  RecommendedPage,
  LoginPage,
  RegisterPage,
  ProfilePage,
  NotFoundPage,
} from './pages';
import { useAuth } from './hooks';

// Auth initialization wrapper component
function AuthInitializer({ children }) {
  const { fetchProfile } = useAuth();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Attempt to restore session on app load
    const initAuth = async () => {
      try {
        await fetchProfile();
      } catch {
        // Silent fail - user not authenticated
      } finally {
        setInitialized(true);
      }
    };

    initAuth();
  }, [fetchProfile]);

  // Could show a loading screen here if needed
  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-black border-t-[var(--color-primary)] animate-spin mx-auto" />
          <p className="mt-4 font-bold text-xl">Loading MagicStream...</p>
        </div>
      </div>
    );
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="movies" element={<MoviesPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Protected Routes */}
        <Route
          path="movie/:imdbId"
          element={
            <ProtectedRoute>
              <MovieDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="recommended"
          element={
            <ProtectedRoute>
              <RecommendedPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <JotaiProvider>
      <BrowserRouter>
        <AuthInitializer>
          <AppRoutes />
        </AuthInitializer>
      </BrowserRouter>
    </JotaiProvider>
  );
}
