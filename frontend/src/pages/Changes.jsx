import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import DataTable from '../components/common/DataTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState, EmptyState } from '../components/common/EmptyState';
import {
  Search,
  Sparkles,
  ExternalLink,
  Clock,
  X,
  RefreshCw,
  LayoutGrid,
  List,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  Zap,
  Target,
  Users,
  ChevronRight,
  Flame,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { api } from '../services/api';

export default function Changes() {
  const { setSidebarOpen } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [changes, setChanges] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Layout View Switcher: 'table' or 'cards'
  const [viewMode, setViewMode] = useState('table');

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState(searchParams.get('competitor') || 'All');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedSignificance, setSelectedSignificance] = useState(searchParams.get('significance') || 'All');
  const [datePreset, setDatePreset] = useState('all'); // 'all' | '7d' | '30d' | 'custom'
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  // Modal / Drawer state
  const [selectedChangeId, setSelectedChangeId] = useState(null);
  const [activeModalChange, setActiveModalChange] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);

  const categories = ['All', 'pricing', 'product', 'changelog', 'marketing', 'blog'];
  const significances = ['All', 'critical', 'high', 'medium', 'low'];

  // Load competitors for the filter dropdown
  useEffect(() => {
    const loadCompetitors = async () => {
      try {
        const res = await api.competitors.getAll();
        setCompetitors(res.data || []);
      } catch (e) {
        console.error('Failed to load competitors for filter:', e);
      }
    };
    loadCompetitors();
  }, []);

  // Compute date range based on preset or custom inputs
  const computeDateRange = () => {
    const now = new Date();
    if (datePreset === '7d') {
      const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString().slice(0, 10) };
    }
    if (datePreset === '30d') {
      const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { from: from.toISOString().slice(0, 10) };
    }
    if (datePreset === 'custom') {
      const range = {};
      if (customFrom) range.from = customFrom;
      if (customTo) range.to = customTo;
      return range;
    }
    return {};
  };

  // Fetch changes with active filters & pagination
  const fetchChanges = async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 10,
      };

      if (selectedCompetitor !== 'All') {
        params.competitor = selectedCompetitor;
      }
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (selectedSignificance !== 'All') {
        params.significance = selectedSignificance;
      }

      const dateRange = computeDateRange();
      if (dateRange.from) params.from = dateRange.from;
      if (dateRange.to) params.to = dateRange.to;

      const res = await api.changes.getAll(params);
      setChanges(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      console.error('Error fetching changes:', err);
      setError(err.message || 'Failed to load changes from API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChanges(1);
  }, [selectedCompetitor, selectedCategory, selectedSignificance, datePreset, customFrom, customTo]);

  // Open full details of a change (fetches complete data including insight)
  const handleOpenDetail = async (changeId) => {
    setSelectedChangeId(changeId);
    setModalLoading(true);
    try {
      const res = await api.changes.getById(changeId);
      setActiveModalChange(res.data);
    } catch (err) {
      console.error('Failed to fetch full change details:', err);
      // Fallback to item from list if available
      const fallback = changes.find((c) => c._id === changeId);
      setActiveModalChange(fallback || null);
    } finally {
      setModalLoading(false);
    }
  };

  // Trigger Gemini AI analysis on demand
  const handleTriggerAnalysis = async (changeId) => {
    setAnalyzingId(changeId);
    try {
      const res = await api.insights.generate(changeId);
      if (activeModalChange && activeModalChange._id === changeId) {
        setActiveModalChange((prev) => ({
          ...prev,
          insight: res.data,
        }));
      }
      fetchChanges(pagination.page);
    } catch (err) {
      alert(`AI Analysis failed: ${err.message}`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const clearAllFilters = () => {
    setSelectedCompetitor('All');
    setSelectedCategory('All');
    setSelectedSignificance('All');
    setDatePreset('all');
    setCustomFrom('');
    setCustomTo('');
    setSearch('');
  };

  const hasActiveFilters =
    selectedCompetitor !== 'All' ||
    selectedCategory !== 'All' ||
    selectedSignificance !== 'All' ||
    datePreset !== 'all' ||
    search.trim() !== '';

  // Client search query refinement
  const filteredChanges = changes.filter((item) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query) ||
      item.competitorId?.name?.toLowerCase().includes(query)
    );
  });

  // Table Columns Definition
  const columns = [
    {
      header: 'Significance',
      key: 'significance',
      className: 'w-32',
      render: (row) => (
        <Badge variant={row.significance} size="sm" dot>
          {row.significance}
        </Badge>
      ),
    },
    {
      header: 'Competitor & Title',
      key: 'title',
      render: (row) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-xs">
              {row.competitorId?.name || 'Competitor'}
            </span>
            <Badge variant={row.category} size="xs">
              {row.category}
            </Badge>
            {row.insight && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                AI Analyzed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-200 font-medium line-clamp-1">{row.title}</p>
        </div>
      ),
    },
    {
      header: 'Source',
      key: 'sourceId',
      render: (row) => (
        <div className="text-xs">
          <span className="text-slate-300 block truncate max-w-[140px]">
            {row.sourceId?.name || 'Public Webpage'}
          </span>
          {row.url && (
            <a
              href={row.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-[11px] text-brand-400 hover:underline inline-flex items-center gap-1 mt-0.5"
            >
              <span>Visit URL</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      ),
    },
    {
      header: 'Detected',
      key: 'detectedAt',
      className: 'w-32',
      render: (row) => (
        <span className="text-xs text-slate-400 flex items-center gap-1.5 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {new Date(row.detectedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Action',
      key: '_id',
      className: 'w-24 text-right',
      render: (row) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpenDetail(row._id);
          }}
          className="px-2.5 py-1 text-xs font-semibold rounded bg-dark-950 border border-slate-700 hover:border-brand-500 text-slate-300 hover:text-white transition"
        >
          View Diff
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Competitive Changes Feed"
        breadcrumbs={['Changes Feed']}
      />

      {/* Filter and Search Card */}
      <Card>
        <div className="space-y-4">
          {/* Top Row: Search & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search changes by title or keyword..."
                className="w-full bg-dark-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Layout Switcher */}
              <div className="flex items-center p-0.5 bg-dark-950 border border-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded transition ${
                    viewMode === 'table'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-1.5 rounded transition ${
                    viewMode === 'cards'
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Cards View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
              </div>

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Filter Attribute Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800/60 text-xs">
            {/* 1. Competitor Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Competitor
              </label>
              <select
                value={selectedCompetitor}
                onChange={(e) => setSelectedCompetitor(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="All">All Competitors</option>
                {competitors.map((c) => (
                  <option key={c._id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Category Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 capitalize focus:outline-none focus:border-brand-500"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'All' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Significance Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Significance Level
              </label>
              <select
                value={selectedSignificance}
                onChange={(e) => setSelectedSignificance(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 capitalize focus:outline-none focus:border-brand-500"
              >
                {significances.map((sig) => (
                  <option key={sig} value={sig}>
                    {sig === 'All' ? 'All Levels' : `${sig} Significance`}
                  </option>
                ))}
              </select>
            </div>

            {/* 4. Date Range Filter */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Date Range
              </label>
              <select
                value={datePreset}
                onChange={(e) => setDatePreset(e.target.value)}
                className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                <option value="all">All Time</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>
          </div>

          {/* Custom Date Pickers (Shown only when 'custom' is selected) */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-3 pt-2 text-xs bg-dark-950/60 p-3 rounded-lg border border-slate-800">
              <Calendar className="w-4 h-4 text-slate-400" />
              <div className="flex items-center gap-2">
                <span className="text-slate-400">From:</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="bg-dark-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">To:</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="bg-dark-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Main Results Container */}
      {loading ? (
        <LoadingSpinner message="Querying live changes from MongoDB..." />
      ) : error ? (
        <ErrorState
          title="Failed to retrieve changes"
          message={error}
          onRetry={() => fetchChanges(pagination.page)}
        />
      ) : filteredChanges.length === 0 ? (
        <EmptyState
          title="No changes match your criteria"
          description="Try broadening your competitor, significance, or date range filters."
          actionLabel={hasActiveFilters ? 'Reset Filters' : undefined}
          onAction={clearAllFilters}
        />
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <Card
          title={`Detected Changes (${pagination.total || filteredChanges.length})`}
          subtitle="Click any row or 'View Diff' to inspect previous vs new values and AI strategic analysis"
        >
          <DataTable
            columns={columns}
            data={filteredChanges}
            pagination={pagination}
            onPageChange={(p) => fetchChanges(p)}
            onRowClick={(row) => handleOpenDetail(row._id)}
          />
        </Card>
      ) : (
        /* CARDS VIEW */
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing {filteredChanges.length} of {pagination.total || filteredChanges.length} changes
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredChanges.map((change) => {
              const isHigh =
                change.significance === 'high' || change.significance === 'critical';
              const isMed = change.significance === 'medium';

              return (
                <div
                  key={change._id}
                  onClick={() => handleOpenDetail(change._id)}
                  className={`bg-dark-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between space-y-3 border-l-4 ${
                    isHigh
                      ? 'border-l-rose-500 bg-rose-500/5'
                      : isMed
                      ? 'border-l-sky-500'
                      : 'border-l-slate-700'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">
                          {change.competitorId?.name || 'Competitor'}
                        </span>
                        <Badge variant={change.category} size="xs">
                          {change.category}
                        </Badge>
                        <Badge variant={change.significance} size="xs" dot>
                          {change.significance}
                        </Badge>
                      </div>

                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(change.detectedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 line-clamp-2">
                      {change.title}
                    </h4>

                    {change.description && (
                      <p className="text-xs text-slate-400 line-clamp-2">
                        {change.description}
                      </p>
                    )}

                    {/* Diff Preview */}
                    {(change.previousValue || change.newValue) && (
                      <div className="mt-2 text-[11px] font-mono p-2.5 rounded-lg bg-dark-950 border border-slate-800/80 space-y-1">
                        {change.previousValue && (
                          <div className="text-rose-400 truncate">
                            <span className="font-bold text-rose-500 mr-1">-</span>
                            {change.previousValue}
                          </div>
                        )}
                        {change.newValue && (
                          <div className="text-emerald-400 truncate">
                            <span className="font-bold text-emerald-500 mr-1">+</span>
                            {change.newValue}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px] truncate max-w-[180px]">
                      {change.sourceId?.name || 'Public Source'}
                    </span>
                    <span className="text-brand-400 font-semibold flex items-center gap-1 hover:underline">
                      <span>Full Details & Insight</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination for Card View */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchChanges(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-dark-900 border border-slate-800 text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchChanges(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-dark-900 border border-slate-800 text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* FULL DETAILS MODAL / DRAWER */}
      {selectedChangeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-dark-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-6">
            {modalLoading ? (
              <LoadingSpinner message="Fetching full change record & AI dossier..." />
            ) : !activeModalChange ? (
              <EmptyState title="Change not found" />
            ) : (
              <>
                {/* Modal Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-white">
                        {activeModalChange.competitorId?.name || 'Competitor'}
                      </span>
                      <Badge variant={activeModalChange.category}>
                        {activeModalChange.category}
                      </Badge>
                      <Badge variant={activeModalChange.significance} dot>
                        {activeModalChange.significance} Significance
                      </Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">
                      {activeModalChange.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Detected on {new Date(activeModalChange.detectedAt).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedChangeId(null);
                      setActiveModalChange(null);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Description */}
                <div className="space-y-1.5 text-xs">
                  <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                    Description & Context
                  </h5>
                  <p className="text-slate-300 leading-relaxed bg-dark-950 p-3.5 rounded-xl border border-slate-800/80">
                    {activeModalChange.description || 'No additional narrative description.'}
                  </p>
                </div>

                {/* Content Diff (Previous vs New) */}
                {(activeModalChange.previousValue || activeModalChange.newValue) && (
                  <div className="space-y-2">
                    <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                      Extracted Text Diff
                    </h5>
                    <div className="p-4 bg-dark-950 rounded-xl border border-slate-800 font-mono text-xs space-y-3">
                      {activeModalChange.previousValue && (
                        <div className="space-y-1">
                          <span className="text-rose-500 font-bold text-[10px] uppercase tracking-wider">
                            Previous Value:
                          </span>
                          <div className="text-rose-300 bg-rose-500/10 p-2.5 rounded border border-rose-500/20 whitespace-pre-wrap">
                            {activeModalChange.previousValue}
                          </div>
                        </div>
                      )}
                      {activeModalChange.newValue && (
                        <div className="space-y-1">
                          <span className="text-emerald-500 font-bold text-[10px] uppercase tracking-wider">
                            New Value:
                          </span>
                          <div className="text-emerald-300 bg-emerald-500/10 p-2.5 rounded border border-emerald-500/20 whitespace-pre-wrap">
                            {activeModalChange.newValue}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* RELATED AI INSIGHT SECTION */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>Gemini Strategic Assessment</span>
                    </h5>
                    {activeModalChange.insight && activeModalChange.insight.confidence !== undefined && (
                      <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {(activeModalChange.insight.confidence * 100).toFixed(0)}% Confidence
                      </span>
                    )}
                  </div>

                  {activeModalChange.insight ? (
                    <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-4 text-xs">
                      {/* Executive Summary */}
                      <div>
                        <h6 className="font-bold text-slate-300 mb-1 uppercase tracking-wider text-[10px]">
                          Executive Summary
                        </h6>
                        <p className="text-slate-200 leading-relaxed">
                          {activeModalChange.insight.summary}
                        </p>
                      </div>

                      {/* 2-col Breakdown: Impact & Advantage */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                        <div className="p-3 bg-dark-950/80 rounded-lg border border-slate-800">
                          <h6 className="font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>Strategic Impact</span>
                          </h6>
                          <p className="text-slate-300 leading-relaxed">
                            {activeModalChange.insight.strategicImpact}
                          </p>
                        </div>

                        <div className="p-3 bg-dark-950/80 rounded-lg border border-rose-500/20">
                          <h6 className="font-bold text-rose-400 mb-1 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" />
                            <span>Competitor Advantage</span>
                          </h6>
                          <p className="text-slate-300 leading-relaxed">
                            {activeModalChange.insight.competitorAdvantage}
                          </p>
                        </div>
                      </div>

                      {/* Recommended Counter-Action */}
                      {activeModalChange.insight.recommendedAction && (
                        <div className="p-3 bg-dark-950/80 rounded-lg border border-emerald-500/20">
                          <h6 className="font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                            <Target className="w-3.5 h-3.5" />
                            <span>Recommended Counter-Action</span>
                          </h6>
                          <p className="text-slate-300 leading-relaxed">
                            {activeModalChange.insight.recommendedAction}
                          </p>
                        </div>
                      )}

                      {/* Affected Segment */}
                      {activeModalChange.insight.affectedSegment && (
                        <div className="pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[11px] text-slate-400">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Affected Segment:</span>
                          <span className="text-slate-200 font-semibold">
                            {activeModalChange.insight.affectedSegment}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Trigger AI Analysis button */
                    <div className="p-4 rounded-xl border border-slate-800 bg-dark-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div>
                        <h6 className="text-xs font-semibold text-white">
                          No Strategic Assessment Generated Yet
                        </h6>
                        <p className="text-[11px] text-slate-400">
                          Synthesize strategic impact, rival advantages, and counter-moves using Gemini.
                        </p>
                      </div>

                      <button
                        onClick={() => handleTriggerAnalysis(activeModalChange._id)}
                        disabled={analyzingId === activeModalChange._id}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold transition shrink-0"
                      >
                        {analyzingId === activeModalChange._id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Analyzing with Gemini...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Run AI Analysis</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Modal Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  {activeModalChange.url ? (
                    <a
                      href={activeModalChange.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:underline"
                    >
                      <span>Open live public source</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span />
                  )}

                  <button
                    onClick={() => {
                      setSelectedChangeId(null);
                      setActiveModalChange(null);
                    }}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
