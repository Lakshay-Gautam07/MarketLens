import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState, EmptyState } from '../components/common/EmptyState';
import {
  Sparkles,
  Zap,
  Target,
  Users,
  Compass,
  TrendingUp,
} from 'lucide-react';
import { api } from '../services/api';

export default function Signals() {
  const { setSidebarOpen } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState([]);
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompetitor, setSelectedCompetitor] = useState('All');

  const fetchSignalsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [insightsRes, compsRes] = await Promise.all([
        api.insights.getAll({ limit: 50 }),
        api.competitors.getAll(),
      ]);

      setInsights(insightsRes.data || []);
      setCompetitors(compsRes.data || []);
    } catch (err) {
      console.error('Failed to load strategic signals:', err);
      setError(err.message || 'Failed to fetch AI insights from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignalsData();
  }, []);

  const filteredInsights = insights.filter((ins) => {
    if (selectedCompetitor === 'All') return true;
    const compName =
      ins.changeId?.competitorId?.name || ins.competitorName;
    return compName === selectedCompetitor;
  });

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Strategic Signals"
        breadcrumbs={['Strategic Signals']}
      />

      {/* Hero explanation card */}
      <div className="p-6 rounded-xl border border-brand-500/30 bg-gradient-to-r from-dark-900 via-dark-900 to-brand-950/40 glow-brand">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </span>
          <h2 className="text-base font-bold text-white">
            Gemini Strategic Intelligence Engine
          </h2>
          <Badge variant="indigo" size="xs">Live Gemini Analysis</Badge>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          MarketLens synthesizes crawling diffs stored in MongoDB into executive-level competitive insights. Each signal evaluates strategic impact, competitive advantages gained by rivals, and specific counter-positioning actions.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-dark-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="text-xs text-slate-400 whitespace-nowrap">Competitor:</span>
          <button
            onClick={() => setSelectedCompetitor('All')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              selectedCompetitor === 'All'
                ? 'bg-brand-600 text-white'
                : 'bg-dark-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            All
          </button>
          {competitors.map((c) => (
            <button
              key={c._id}
              onClick={() => setSelectedCompetitor(c.name)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                selectedCompetitor === c.name
                  ? 'bg-brand-600 text-white'
                  : 'bg-dark-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 whitespace-nowrap">
          Showing <span className="font-bold text-white">{filteredInsights.length}</span> strategic signals
        </span>
      </div>

      {loading ? (
        <LoadingSpinner message="Fetching AI signals from MongoDB..." />
      ) : error ? (
        <ErrorState
          title="Could not load strategic signals"
          message={error}
          onRetry={fetchSignalsData}
        />
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          title="No strategic signals found"
          description="There are currently no AI insights stored in MongoDB for this filter."
        />
      ) : (
        /* Strategic Insights Cards */
        <div className="space-y-6">
          {filteredInsights.map((ins) => {
            const compName =
              ins.changeId?.competitorId?.name || ins.competitorName || 'Competitor';
            const category =
              ins.changeId?.category || ins.category || 'general';
            const title =
              ins.changeId?.title || ins.changeTitle || 'Competitive Change Analysis';
            const confidencePercent =
              ins.confidence !== undefined
                ? Math.round(ins.confidence * 100)
                : 85;

            return (
              <div
                key={ins._id}
                className="bg-dark-900 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-6 transition-all duration-200 space-y-5"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-white">{compName}</span>
                      <Badge variant={category}>{category}</Badge>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{title}</h3>
                  </div>

                  {/* Confidence Score */}
                  <div className="flex items-center gap-3 bg-dark-950 px-3.5 py-1.5 rounded-lg border border-slate-800">
                    <div className="text-right">
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        Confidence
                      </p>
                      <p className="text-xs font-black text-amber-400">
                        {confidencePercent}%
                      </p>
                    </div>
                    <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full"
                        style={{ width: `${confidencePercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Strategic Summary */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Compass className="w-3.5 h-3.5 text-brand-400" />
                    Executive Summary
                  </h4>
                  <p className="text-xs text-slate-200 leading-relaxed bg-dark-950/50 p-3.5 rounded-lg border border-slate-800/60">
                    {ins.summary}
                  </p>
                </div>

                {/* 3 Grid Breakdown: Impact, Advantage, Counter Action */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Strategic Impact */}
                  <div className="p-4 rounded-xl bg-dark-950 border border-slate-800/90 space-y-2">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                      <TrendingUp className="w-4 h-4" />
                      <span>Strategic Impact</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ins.strategicImpact || 'Not evaluated'}
                    </p>
                  </div>

                  {/* Competitor Advantage */}
                  <div className="p-4 rounded-xl bg-dark-950 border border-rose-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                      <Zap className="w-4 h-4" />
                      <span>Competitor Advantage</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ins.competitorAdvantage || 'Not evaluated'}
                    </p>
                  </div>

                  {/* Recommended Action */}
                  <div className="p-4 rounded-xl bg-dark-950 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      <Target className="w-4 h-4" />
                      <span>Recommended Action</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {ins.recommendedAction || 'No action specified'}
                    </p>
                  </div>
                </div>

                {/* Footer meta: Affected Segment & Date */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>Affected Target Segments:</span>
                    <span className="text-slate-200 font-semibold">
                      {ins.affectedSegment || 'General market'}
                    </span>
                  </div>
                  <span>
                    Analyzed on {new Date(ins.createdAt).toLocaleString()}
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
