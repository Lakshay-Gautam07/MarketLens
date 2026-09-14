import React from 'react';

export default function Card({
  title,
  subtitle,
  action,
  children,
  className = '',
  headerClassName = '',
  bodyClassName = '',
  hoverEffect = false,
  glow = false,
}) {
  return (
    <div
      className={`bg-dark-900 border border-slate-800/80 rounded-xl overflow-hidden ${
        glow ? 'glow-brand border-brand-500/30' : ''
      } ${
        hoverEffect
          ? 'transition-all duration-200 hover:border-slate-700 hover:shadow-lg hover:shadow-black/40'
          : ''
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div
          className={`px-5 py-4 border-b border-slate-800/60 flex items-center justify-between ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-slate-100 tracking-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
