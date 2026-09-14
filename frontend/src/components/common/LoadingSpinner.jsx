import React from 'react';

export function LoadingSpinner({ size = 'md', message = 'Loading intelligence data...' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center p-12 text-slate-400">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-brand-500 border-t-transparent rounded-full animate-spin`}
      />
      {message && <p className="mt-3 text-xs tracking-wide text-slate-400 font-medium">{message}</p>}
    </div>
  );
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <div className="animate-pulse flex items-center gap-4 py-4 px-4 border-b border-slate-800/50">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-slate-800/60 rounded"
          style={{ width: `${Math.max(40, 100 - i * 20)}%` }}
        />
      ))}
    </div>
  );
}

export default LoadingSpinner;
