/**
 * ProtectedRoute Component - Route guard for authenticated routes
 * 
 * SECURITY FEATURES:
 * - Redirects unauthenticated users to login
 * - Preserves intended destination for post-login redirect
 * - Shows loading state while checking auth
 * - Optional admin-only restriction
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAtomValue } from 'jotai';
import { userAtom } from '../atoms';
import LoadingSpinner from './LoadingSpinner';

export default function ProtectedRoute({ 
  children, 
  adminOnly = false,
  loading = false 
}) {
  const user = useAtomValue(userAtom);
  const location = useLocation();

  // Show loading while checking auth state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <Navigate 
        to="/login" 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // Check admin access if required
  if (adminOnly && user.role !== 'ADMIN') {
    return (
      <div className="brutal-card p-8 text-center max-w-md mx-auto mt-20">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="font-black text-2xl mb-2">Access Denied</h2>
        <p className="text-gray-600">
          This page requires administrator privileges.
        </p>
      </div>
    );
  }

  return children;
}
