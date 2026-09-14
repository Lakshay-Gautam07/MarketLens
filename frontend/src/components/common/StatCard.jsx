import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  description,
  accentColor = 'brand',
}) {
  const accentBorders = {
    brand: 'border-brand-500/20 text-brand-400 bg-brand-500/10',
    cyan: 'border-cyan-500/20 text-cyan-400 bg-cyan-500/10',
    emerald: 'border-emerald-500/20 text-emerald-400 bg-emerald-500/10',
    amber: 'border-amber-500/20 text-amber-400 bg-amber-500/10',
    rose: 'border-rose-500/20 text-rose-400 bg-rose-500/10',
  };

  return (
    <div className="bg-dark-900 border border-slate-800/80 rounded-xl p-5 hover:border-slate-700 transition-all duration-200">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </p>
        {Icon && (
          <div className={`p-2 rounded-lg border ${accentBorders[accentColor] || accentBorders.brand}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-3">
        <span className="text-2xl font-bold text-slate-100 tracking-tight">
          {value}
        </span>
        {change && (
          <span
            className={`inline-flex items-center text-xs font-medium ${
              changeType === 'positive'
                ? 'text-emerald-400'
                : changeType === 'negative'
                ? 'text-rose-400'
                : 'text-slate-400'
            }`}
          >
            {changeType === 'positive' && <TrendingUp className="w-3 h-3 mr-0.5" />}
            {changeType === 'negative' && <TrendingDown className="w-3 h-3 mr-0.5" />}
            {change}
          </span>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-500 mt-2">{description}</p>
      )}
    </div>
  );
}
