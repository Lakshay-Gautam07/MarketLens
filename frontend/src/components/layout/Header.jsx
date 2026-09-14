import React from 'react';
import { Menu, Search, Bell, RefreshCw, Sparkles, ExternalLink } from 'lucide-react';

export default function Header({ onMenuClick, title, breadcrumbs = [] }) {
  return (
    <header className="h-16 bg-dark-900/80 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 flex items-center justify-between">
      {/* Left title & breadcrumb area */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
              <span>MarketLens</span>
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  <span>/</span>
                  <span className={idx === breadcrumbs.length - 1 ? 'text-slate-300' : ''}>
                    {crumb}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
          <h1 className="text-base font-bold text-white tracking-tight leading-none mt-0.5">
            {title || 'Overview'}
          </h1>
        </div>
      </div>

      {/* Center Search Input */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search changes, pricing, competitors (e.g. Notion AI)..."
            className="w-full bg-dark-950/80 border border-slate-800 rounded-lg pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/80 focus:ring-1 focus:ring-brand-500/80 transition"
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Gemini AI Status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Gemini 3.6 Flash Active</span>
        </div>

        {/* Sync button */}
        <button
          title="Trigger manual crawl"
          onClick={() => alert('Manual crawl triggered. Fetching 14 competitor sources...')}
          className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* Notification bell */}
        <div className="relative">
          <button className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition">
            <Bell className="w-4 h-4" />
          </button>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
        </div>

        {/* User avatar / profile */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-accent-cyan flex items-center justify-center text-xs font-bold text-white border border-slate-700">
          LG
        </div>
      </div>
    </header>
  );
}
