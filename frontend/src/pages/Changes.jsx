import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import DataTable from '../components/common/DataTable';
import {
  Search,
  Filter,
  Sparkles,
  ExternalLink,
  Clock,
  X,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { mockChanges, mockInsights } from '../data/mockData';

export default function Changes() {
  const { setSidebarOpen } = useOutletContext();
  const [search, setSearch] = useState('');
  const [selectedCompetitor, setSelectedCompetitor] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSignificance, setSelectedSignificance] = useState('All');
  const [activeModalChange, setActiveModalChange] = useState(null);

  const competitors = ['All', 'Notion', 'Linear', 'ClickUp', 'Asana'];
  const categories = ['All', 'pricing', 'product', 'changelog', 'marketing', 'blog'];
  const significances = ['All', 'critical', 'high', 'medium', 'low'];

  const filteredChanges = mockChanges.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchesComp =
      selectedCompetitor === 'All' || item.competitorId.name === selectedCompetitor;
    const matchesCat =
      selectedCategory === 'All' || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSig =
      selectedSignificance === 'All' || item.significance.toLowerCase() === selectedSignificance.toLowerCase();

    return matchesSearch && matchesComp && matchesCat && matchesSig;
  });

  const columns = [
    {
      header: 'Competitor & Title',
      key: 'title',
      render: (row) => (
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-bold text-white text-xs">{row.competitorId.name}</span>
            <Badge variant={row.category} size="xs">{row.category}</Badge>
            {row.hasAiInsight && (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-300 font-semibold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                <Sparkles className="w-2.5 h-2.5" />
                AI Analyzed
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300 font-medium line-clamp-1">{row.title}</p>
        </div>
      ),
    },
    {
      header: 'Significance',
      key: 'significance',
      render: (row) => <Badge variant={row.significance}>{row.significance}</Badge>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <Badge variant={row.status}>{row.status}</Badge>,
    },
    {
      header: 'Detected',
      key: 'detectedAt',
      render: (row) => (
        <span className="text-xs text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          {new Date(row.detectedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      header: 'Source',
      key: 'sourceId',
      render: (row) => (
        <a
          href={row.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-xs text-brand-400 hover:underline inline-flex items-center gap-1"
        >
          <span className="truncate max-w-[120px]">{row.sourceId.name}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Detected Changes"
        breadcrumbs={['Changes Feed']}
      />

      {/* Filter and Search Bar */}
      <Card>
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by keyword, plan name, or feature..."
                className="w-full bg-dark-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
              />
            </div>

            {/* Competitor filter dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 whitespace-nowrap">Competitor:</span>
              <select
                value={selectedCompetitor}
                onChange={(e) => setSelectedCompetitor(e.target.value)}
                className="bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-brand-500"
              >
                {competitors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tag filters */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/60 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Category:</span>
              <div className="flex items-center gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded text-[11px] capitalize font-medium transition ${
                      selectedCategory === cat
                        ? 'bg-brand-600 text-white'
                        : 'bg-dark-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-slate-400">Significance:</span>
              <div className="flex items-center gap-1">
                {significances.map((sig) => (
                  <button
                    key={sig}
                    onClick={() => setSelectedSignificance(sig)}
                    className={`px-2 py-1 rounded text-[11px] capitalize font-medium transition ${
                      selectedSignificance === sig
                        ? 'bg-slate-700 text-white'
                        : 'bg-dark-950 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sig}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Changes Table */}
      <Card
        title={`All Detected Movements (${filteredChanges.length})`}
        subtitle="Click any row to inspect deep diff details and AI impact assessment"
      >
        <DataTable
          columns={columns}
          data={filteredChanges}
          onRowClick={(row) => setActiveModalChange(row)}
        />
      </Card>

      {/* Detail Slide-Over Modal */}
      {activeModalChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-dark-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm font-bold text-white">
                    {activeModalChange.competitorId.name}
                  </span>
                  <Badge variant={activeModalChange.category}>
                    {activeModalChange.category}
                  </Badge>
                  <Badge variant={activeModalChange.significance}>
                    {activeModalChange.significance}
                  </Badge>
                </div>
                <h3 className="text-base font-bold text-slate-100">
                  {activeModalChange.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveModalChange(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <div className="text-xs text-slate-300 leading-relaxed">
              <h5 className="font-semibold text-slate-400 uppercase tracking-wider mb-1">Description</h5>
              <p>{activeModalChange.description}</p>
            </div>

            {/* Previous vs New Diff */}
            <div className="space-y-2">
              <h5 className="font-semibold text-slate-400 uppercase tracking-wider text-xs">
                Content Diff
              </h5>
              <div className="p-3 bg-dark-950 rounded-lg border border-slate-800 font-mono text-xs space-y-2">
                <div className="text-rose-400">
                  <span className="font-bold mr-2 text-rose-500">PREV:</span>
                  {activeModalChange.previousValue}
                </div>
                <div className="text-emerald-400">
                  <span className="font-bold mr-2 text-emerald-500">NEW:</span>
                  {activeModalChange.newValue}
                </div>
              </div>
            </div>

            {/* AI Insight Box (if available) */}
            {activeModalChange.hasAiInsight && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-4 h-4" />
                  <span>Gemini AI Strategic Assessment</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {mockInsights[0].summary}
                </p>
                <div className="p-2.5 rounded-lg bg-dark-950 border border-slate-800 text-xs">
                  <span className="font-semibold text-emerald-400">Recommended Action:</span>{' '}
                  <span className="text-slate-300">{mockInsights[0].recommendedAction}</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <a
                href={activeModalChange.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-brand-400 hover:underline"
              >
                <span>View live source URL</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                onClick={() => setActiveModalChange(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
