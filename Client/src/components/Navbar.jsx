/**
 * Navbar Component - Navigation with responsive menu
 * 
 * UX FEATURES:
 * - Mobile-first responsive design
 * - Clear visual hierarchy
 * - Accessible keyboard navigation
 * - Loading state for logout
 */

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks';

export default function Navbar() {
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { path: '/', label: 'Home', public: true },
    { path: '/movies', label: 'Movies', public: true },
    { path: '/recommended', label: 'For You', public: false },
  ];

  const handleLogout = async () => {
    setIsMobileMenuOpen(false);
    await logout();
  };

  return (
    <nav className="bg-white border-b-3 border-black sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center gap-2 font-black text-xl md:text-2xl hover:text-[var(--color-primary)] transition-colors"
          >
            <span className="bg-[var(--color-primary)] text-white px-2 py-1 border-3 border-black brutal-shadow">
              MS
            </span>
            <span className="hidden sm:inline">MagicStream</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks.map((link) => 
              (link.public || isAuthenticated) && (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-2 font-bold transition-all border-3 ${
                    isActive(link.path)
                      ? 'bg-[var(--color-accent)] border-black brutal-shadow'
                      : 'border-transparent hover:border-black hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  className={`px-4 py-2 font-bold transition-all border-3 ${
                    isActive('/profile')
                      ? 'bg-[var(--color-secondary)] border-black brutal-shadow'
                      : 'border-transparent hover:border-black hover:bg-gray-100'
                  }`}
                >
                  {user?.first_name || 'Profile'}
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={loading}
                  className="brutal-btn bg-[var(--color-primary)] text-white disabled:opacity-50"
                >
                  {loading ? 'Logging out...' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="brutal-btn bg-white hover:bg-gray-100"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="brutal-btn bg-[var(--color-secondary)] text-black"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 border-3 border-black brutal-shadow bg-white"
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t-3 border-black py-4 space-y-2">
            {navLinks.map((link) =>
              (link.public || isAuthenticated) && (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3 font-bold border-3 ${
                    isActive(link.path)
                      ? 'bg-[var(--color-accent)] border-black'
                      : 'border-transparent hover:border-black hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
            
            <div className="pt-4 border-t-3 border-black space-y-2">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 font-bold border-3 border-transparent hover:border-black hover:bg-gray-100"
                  >
                    Profile ({user?.first_name})
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={loading}
                    className="w-full brutal-btn bg-[var(--color-primary)] text-white"
                  >
                    {loading ? 'Logging out...' : 'Logout'}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block brutal-btn bg-white text-center"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block brutal-btn bg-[var(--color-secondary)] text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
