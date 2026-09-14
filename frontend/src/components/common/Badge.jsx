import React from 'react';

const colorStyles = {
  // Significance
  critical: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  high: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  medium: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  low: 'bg-slate-500/15 text-slate-400 border-slate-500/30',

  // Status
  new: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30 animate-pulse',
  reviewed: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  actioned: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  dismissed: 'bg-slate-600/15 text-slate-500 border-slate-600/30',

  // Categories
  pricing: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  product: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  changelog: 'bg-violet-500/15 text-violet-400 border-violet-500/30',
  marketing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  blog: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  hiring: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30',
  other: 'bg-slate-500/15 text-slate-400 border-slate-500/30',

  // Generic colors
  emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  rose: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  slate: 'bg-slate-800 text-slate-400 border-slate-700',
};

export default function Badge({ children, variant = 'slate', className = '', size = 'sm' }) {
  const style = colorStyles[variant.toLowerCase()] || colorStyles.slate;
  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border capitalize tracking-wide ${style} ${sizeClasses} ${className}`}
    >
      {children}
    </span>
  );
}
