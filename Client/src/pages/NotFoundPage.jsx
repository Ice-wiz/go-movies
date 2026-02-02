/**
 * NotFoundPage - 404 error page
 */

import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="brutal-card bg-white p-8 md:p-12 text-center max-w-md">
        <div className="text-8xl mb-4">🎬</div>
        <h1 className="text-4xl md:text-6xl font-black mb-4">404</h1>
        <h2 className="text-xl font-bold mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Looks like this scene was cut from the final movie. 
          Let's get you back to the show!
        </p>
        <Link
          to="/"
          className="brutal-btn bg-[var(--color-primary)] text-white inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
