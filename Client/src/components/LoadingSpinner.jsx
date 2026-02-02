/**
 * LoadingSpinner Component - Neubrutalism styled loader
 */

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-black border-t-[var(--color-primary)] animate-spin`}
        role="status"
        aria-label="Loading"
      />
      <span className="font-bold text-sm">Loading...</span>
    </div>
  );
}
