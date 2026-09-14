import React from 'react';

const colorStyles = {
  // Significance
  critical: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  high: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  medium: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  low: 'bg-slate-500/15 text-slate-300 border-slate-500/30',

  // Status
  new: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
  reviewed: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  actioned: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  dismissed: 'bg-slate-600/15 text-slate-400 border-slate-600/30',

  // Categories
  pricing: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  product: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  changelog: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  marketing: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  blog: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  hiring: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30',
  other: 'bg-slate-500/15 text-slate-400 border-slate-500/30',

  // Generic colors
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
  slate: 'bg-slate-800 text-slate-300 border-slate-700',
};

const dotStyles = {
  critical: 'bg-rose-400',
  high: 'bg-amber-400',
  medium: 'bg-sky-400',
  low: 'bg-slate-400',
  new: 'bg-cyan-400',
  pricing: 'bg-emerald-400',
  product: 'bg-indigo-400',
};

export default function Badge({
  children,
  variant = 'slate',
  className = '',
  size = 'sm',
  dot = false,
}) {
  const normalizedVariant = variant?.toLowerCase() || 'slate';
  const style = colorStyles[normalizedVariant] || colorStyles.slate;
  const dotStyle = dotStyles[normalizedVariant];
  const sizeClasses = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border capitalize tracking-wide ${style} ${sizeClasses} ${className}`}
    >
      {dot && dotStyle && (
        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyle}`} />
      )}
      <span>{children}</span>
    </span>
  );
}
