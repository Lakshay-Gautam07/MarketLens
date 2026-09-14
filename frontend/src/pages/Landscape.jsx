import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import DataTable from '../components/common/DataTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState, EmptyState } from '../components/common/EmptyState';
import {
  Search,
  ArrowUpRight,
  Globe,
  Flame,
  AlertTriangle,
  GitCommit,
  Radio,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  List,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';

export default function Landscape() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [changes, setChanges] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'table'

  const fetchLandscapeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, changeRes] = await Promise.all([
        api.competitors.getAll(),
        api.changes.getAll({ limit: 100 }),
      ]);

      setCompetitors(compRes.data || []);
      setChanges(changeRes.data || []);
    } catch (err) {
      console.error('Error loading landscape data:', err);
      setError(err.message || 'Failed to fetch competitor landscape from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLandscapeData();
  }, []);

  // Compute change statistics per competitor
  const competitorsWithStats = competitors.map((comp) => {
    const compChanges = changes.filter(
      (c) =>
        c.competitorId?._id === comp._id ||
        c.competitorId === comp._id ||
        c.competitorId?.name === comp.name
    );

    const criticalCount = compChanges.filter((c) => c.significance === 'critical').length;
    const highCount = compChanges.filter((c) => c.significance === 'high').length;
    const mediumCount = compChanges.filter((c) => c.significance === 'medium').length;
    const lowCount = compChanges.filter((c) => c.significance === 'low').length;

    const highPlusCritical = criticalCount + highCount;
    const latestChange = compChanges[0] || null;

    return {
      ...comp,
      changesCount: compChanges.length,
      highPlusCritical,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      latestChange,
      hasSignificantMoves: highPlusCritical > 0,
    };
  });

  // Identify highest urgency competitor
  const maxHighMoves = Math.max(...competitorsWithStats.map((c) => c.highPlusCritical), 0);

  // Extract unique categories dynamically
  const dynamicCategories = [
    'All',
    ...new Set(competitors.map((c) => c.category).filter(Boolean)),
  ];

  const filteredCompetitors = competitorsWithStats.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(search.toLowerCase())) ||
      (c.category && c.category.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory =
      selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Table Columns for Comparison Table View
  const comparisonColumns = [
    {
      header: 'Competitor',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <img
            src={row.logo}
            alt={row.name}
            onError={(e) => {
              e.target.style.display = 'none';
            }}
            className="w-8 h-8 rounded-lg bg-slate-800 p-1 border border-slate-700 object-contain"
          />
          <div>
            <p className="font-bold text-white text-xs flex items-center gap-1.5">
              {row.name}
              {row.highPlusCritical > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Recent High Urgency Shifts" />
              )}
            </p>
            <p className="text-[11px] text-slate-400">{row.category}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Website',
      key: 'website',
      render: (row) => (
        <a
          href={row.website}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-brand-400 hover:underline inline-flex items-center gap-1"
        >
          <span>{row.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span>
          <ExternalLink className="w-3 h-3 text-slate-500" />
        </a>
      ),
    },
    {
      header: 'Status',
      key: 'active',
      render: (row) => (
        <Badge variant={row.active !== false ? 'emerald' : 'slate'} size="xs" dot>
          {row.active !== false ? 'Active' : 'Paused'}
        </Badge>
      ),
    },
    {
      header: 'Recent Changes',
      key: 'changesCount',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-white">{row.changesCount}</span>
          <span className="text-[11px] text-slate-500">logged</span>
        </div>
      ),
    },
    {
      header: 'Urgency Posture',
      key: 'highPlusCritical',
      render: (row) => {
        if (row.highPlusCritical > 0) {
          return (
            <Badge variant="critical" size="xs" dot>
              {row.highPlusCritical} High / Critical Move{row.highPlusCritical > 1 ? 's' : ''}
            </Badge>
          );
        }
        if (row.mediumCount > 0) {
          return (
            <Badge variant="medium" size="xs" dot>
              {row.mediumCount} Moderate Update{row.mediumCount > 1 ? 's' : ''}
            </Badge>
          );
        }
        return (
          <Badge variant="slate" size="xs">
            Stable
          </Badge>
        );
      },
    },
    {
      header: 'Action',
      key: '_id',
      className: 'text-right',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/landscape/${row._id}`);
          }}
          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-lg bg-dark-950 border border-slate-700 hover:border-brand-500 text-slate-200 hover:text-white transition"
        >
          <span>Dossier</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Competitive Landscape"
        breadcrumbs={['Landscape']}
      />

      {/* Overview Comparison Summary Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-dark-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Monitored
          </p>
          <p className="text-2xl font-black text-white mt-1">{competitors.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Competitors in MongoDB</p>
        </div>

        <div className="bg-dark-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            High-Impact Shifts
          </p>
          <p className="text-2xl font-black text-rose-400 mt-1">
            {competitorsWithStats.filter((c) => c.highPlusCritical > 0).length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Competitors with critical moves</p>
        </div>

        <div className="bg-dark-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Market Categories
          </p>
          <p className="text-2xl font-black text-brand-400 mt-1">
            {dynamicCategories.length - 1}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Product segments covered</p>
        </div>
      </div>

      {/* Action and Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-dark-900 border border-slate-800 p-3.5 rounded-xl">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, category, or keyword..."
            className="w-full bg-dark-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Category Filter Pills & Layout Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {dynamicCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'bg-dark-950 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-dark-950 border border-slate-800 rounded-lg text-xs shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded transition ${
                viewMode === 'cards'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Comparison Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner message="Querying competitor records & change diffs from MongoDB..." />
      ) : error ? (
        <ErrorState
          title="Could not load competitor landscape"
          message={error}
          onRetry={fetchLandscapeData}
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
      ) : viewMode === 'table' ? (
        /* COMPARISON TABLE VIEW */
        <Card
          title={`Competitor Comparison Table (${filteredCompetitors.length})`}
          subtitle="Direct side-by-side comparison of active competitors and change frequency"
        >
          <DataTable
            columns={comparisonColumns}
            data={filteredCompetitors}
            onRowClick={(row) => navigate(`/landscape/${row._id}`)}
          />
        </Card>
      ) : (
        /* COMPARISON CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredCompetitors.map((comp) => {
            const hasHighUrgency = comp.highPlusCritical > 0;
            const isTopActive = maxHighMoves > 0 && comp.highPlusCritical === maxHighMoves;

            return (
              <div
                key={comp._id}
                onClick={() => navigate(`/landscape/${comp._id}`)}
                className={`bg-dark-900 border rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between group relative overflow-hidden ${
                  hasHighUrgency
                    ? 'border-rose-500/40 bg-gradient-to-br from-dark-900 via-dark-900 to-rose-950/20 hover:border-rose-500 hover:shadow-xl hover:shadow-rose-950/20'
                    : 'border-slate-800/80 hover:border-slate-700 hover:shadow-xl hover:shadow-black/50'
                }`}
              >
                {/* Significance Spotlight Flag */}
                {isTopActive && (
                  <div className="absolute top-0 right-0 bg-rose-600 text-white text-[9px] font-extrabold uppercase tracking-widest px-3 py-0.5 rounded-bl-lg shadow flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    <span>Most Significant Shifts</span>
                  </div>
                )}

                <div>
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                    <div className="flex items-center gap-3">
                      <img
                        src={comp.logo}
                        alt={comp.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                        className="w-11 h-11 rounded-lg bg-slate-800 p-1.5 border border-slate-700 object-contain group-hover:border-brand-500/50 transition shrink-0"
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
                      {hasHighUrgency ? (
                        <Badge variant="critical" size="xs" dot>
                          High Significance
                        </Badge>
                      ) : (
                        <Badge variant={comp.active !== false ? 'emerald' : 'slate'} size="xs" dot>
                          {comp.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-4">
                    {comp.description || 'No description available for this competitor.'}
                  </p>

                  {/* Latest Movement Highlight (if available) */}
                  {comp.latestChange && (
                    <div className="mb-4 p-2.5 rounded-lg bg-dark-950/70 border border-slate-800/80 text-xs">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-300">Latest Movement:</span>
                        <Badge variant={comp.latestChange.significance} size="xs" dot>
                          {comp.latestChange.significance}
                        </Badge>
                      </div>
                      <p className="text-slate-200 font-medium line-clamp-1">
                        {comp.latestChange.title}
                      </p>
                    </div>
                  )}
                </div>

                {/* Metrics & Action Footer */}
                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-4">
                    <a
                      href={comp.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-slate-400 hover:text-brand-400 transition"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[130px]">
                        {comp.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                      </span>
                    </a>

                    <span className="flex items-center gap-1 text-slate-300">
                      <GitCommit className="w-3.5 h-3.5 text-brand-400" />
                      <strong>{comp.changesCount}</strong> changes
                    </span>
                  </div>

                  <span className="text-[11px] text-brand-400 font-semibold group-hover:underline flex items-center gap-0.5">
                    <span>Open Dossier</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
