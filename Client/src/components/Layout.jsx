/**
 * Layout Component - Main app wrapper
 * 
 * Provides:
 * - Consistent navigation
 * - Responsive container
 * - Toast notifications
 */

import { Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Toast Configuration for consistent UX */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
            border: '3px solid #000',
            boxShadow: '4px 4px 0px 0px #000',
            borderRadius: '0',
            fontWeight: '600',
          },
          success: {
            iconTheme: {
              primary: '#22C55E',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#FF6B6B',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Navbar />
      
      {/* Main content area with responsive padding */}
      <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8">
        <Outlet />
      </main>
      
      {/* Footer */}
      <footer className="border-t-3 border-black bg-white mt-auto py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="font-bold text-lg">MagicStream Movies</p>
          <p className="text-gray-600 mt-1">Your Personal Movie Curator</p>
        </div>
      </footer>
    </div>
  );
}
