import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Badge from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState, EmptyState } from '../components/common/EmptyState';
import {
  Search,
  ArrowUpRight,
  Globe,
} from 'lucide-react';
import { api } from '../services/api';

export default function Landscape() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchCompetitors = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.competitors.getAll();
      setCompetitors(res.data || []);
    } catch (err) {
      console.error('Error loading competitors:', err);
      setError(err.message || 'Failed to fetch competitors from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompetitors();
  }, []);

  // Extract unique categories dynamically from real data
  const dynamicCategories = ['All', ...new Set(competitors.map((c) => c.category).filter(Boolean))];

  const filteredCompetitors = competitors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Competitive Landscape"
        breadcrumbs={['Landscape']}
      />

      {/* Action and Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracked competitors..."
            className="w-full bg-dark-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {dynamicCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-dark-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Loading competitors from MongoDB..." />
      ) : error ? (
        <ErrorState
          title="Could not load competitors"
          message={error}
          onRetry={fetchCompetitors}
        />
      ) : filteredCompetitors.length === 0 ? (
        <EmptyState
          title="No competitors found"
          description={
            search
              ? `No competitors matched "${search}". Try adjusting your filters.`
              : 'No competitors registered in MongoDB database.'
          }
        />
      ) : (
        /* Competitors Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCompetitors.map((comp) => (
            <div
              key={comp._id}
              onClick={() => navigate(`/landscape/${comp._id}`)}
              className="bg-dark-900 border border-slate-800/80 hover:border-slate-700 hover:shadow-xl hover:shadow-black/50 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Card top */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={comp.logo}
                      alt={comp.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      className="w-10 h-10 rounded-lg bg-slate-800 p-1 border border-slate-700 object-contain group-hover:border-brand-500/50 transition"
                    />
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition flex items-center gap-2">
                        {comp.name}
                        <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition" />
                      </h3>
                      <p className="text-xs text-slate-400">{comp.category}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Badge variant={comp.active !== false ? 'emerald' : 'slate'}>
                      {comp.active !== false ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-4">
                  {comp.description || 'No description provided.'}
                </p>
              </div>

              {/* Metrics footer */}
              <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <a
                  href={comp.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-slate-400 hover:text-brand-400 text-xs transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{comp.website.replace(/^https?:\/\//, '')}</span>
                </a>

                <span className="text-[11px] text-brand-400 font-semibold group-hover:underline">
                  View Intelligence Dossier &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
