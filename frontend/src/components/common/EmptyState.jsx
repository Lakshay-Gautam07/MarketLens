import React from 'react';
import { AlertCircle, FolderSearch, RefreshCw } from 'lucide-react';

export function EmptyState({
  title = 'No records found',
  description = 'There is currently no data to display for this view or filter.',
  actionLabel,
  onAction,
  icon: Icon = FolderSearch,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-dark-900/50 rounded-xl border border-dashed border-slate-800">
      <div className="p-3 bg-slate-800/40 rounded-full text-slate-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-3.5 py-1.5 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition shadow-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

export function ErrorState({
  title = 'Failed to load intelligence data',
  message = 'An unexpected error occurred while communicating with the data layer.',
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-500/5 rounded-xl border border-rose-500/20">
      <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-full mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-rose-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-dark-800 hover:bg-dark-700 text-slate-200 border border-slate-700 rounded-lg transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Request</span>
        </button>
      )}
    </div>
  );
}

export default EmptyState;
