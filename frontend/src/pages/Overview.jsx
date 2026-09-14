import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState, EmptyState } from '../components/common/EmptyState';
import {
  Compass,
  GitCommit,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Clock,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  Info,
  ExternalLink,
  Target,
} from 'lucide-react';
import { api } from '../services/api';

export default function Overview() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [changes, setChanges] = useState([]);
  const [insights, setInsights] = useState([]);
  const [totalChangesCount, setTotalChangesCount] = useState(0);

  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, changeRes, insightRes] = await Promise.all([
        api.competitors.getAll({ limit: 20 }),
        api.changes.getAll({ limit: 20 }),
        api.insights.getAll({ limit: 5 }),
      ]);

      setCompetitors(compRes.data || []);
      setChanges(changeRes.data || []);
      setTotalChangesCount(changeRes.pagination?.total || changeRes.data?.length || 0);
      setInsights(insightRes.data || []);
    } catch (err) {
      console.error('Error fetching overview data:', err);
      setError(err.message || 'Failed to load live intelligence data from backend');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Intelligence Overview"
          breadcrumbs={['Dashboard']}
        />
        <LoadingSpinner message="Synthesizing real-time competitive intelligence from MongoDB..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Intelligence Overview"
          breadcrumbs={['Dashboard']}
        />
        <ErrorState
          title="Could not connect to MarketLens API"
          message={error}
          onRetry={fetchOverviewData}
        />
      </div>
    );
  }

  // Calculate significance breakdown
  const criticalCount = changes.filter((c) => c.significance === 'critical').length;
  const highCount = changes.filter((c) => c.significance === 'high').length;
  const mediumCount = changes.filter((c) => c.significance === 'medium').length;
  const lowCount = changes.filter((c) => c.significance === 'low').length;
  const highPlusCritical = criticalCount + highCount;
  const totalCalculated = changes.length || 1;

  const highPct = Math.round((highPlusCritical / totalCalculated) * 100);
  const medPct = Math.round((mediumCount / totalCalculated) * 100);
  const lowPct = Math.max(0, 100 - highPct - medPct);

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Executive PM Overview"
        breadcrumbs={['Dashboard']}
      />

      {/* 1. KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tracked Competitors"
          value={competitors.length}
          change={`${competitors.filter((c) => c.active !== false).length} active`}
          changeType="positive"
          icon={Compass}
          description="In MongoDB cluster"
          accentColor="brand"
        />
        <StatCard
          title="Logged Changes"
          value={totalChangesCount}
          change="Real-time diffs"
          changeType="positive"
          icon={GitCommit}
          description="Detected across sources"
          accentColor="cyan"
        />
        <StatCard
          title="High Urgency Shifts"
          value={highPlusCritical}
          change={highPlusCritical > 0 ? 'Requires attention' : 'Nominal'}
          changeType={highPlusCritical > 0 ? 'negative' : 'positive'}
          icon={ShieldAlert}
          description="High or critical impact"
          accentColor="rose"
        />
        <StatCard
          title="AI Signals Generated"
          value={insights.length}
          change="Gemini 3.6 Flash"
          changeType="positive"
          icon={Sparkles}
          description="Strategic assessments"
          accentColor="amber"
        />
      </div>

      {/* 2. Significance Breakdown Bar (PM Quick Glance) */}
      <div className="bg-dark-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Significance Impact Breakdown</span>
              <span className="text-xs text-slate-400 font-normal">
                (Based on {changes.length} recent moves)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Quick distribution of market activity urgency to prioritize PM roadmap counter-moves.
            </p>
          </div>

          <button
            onClick={() => navigate('/changes')}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            <span>Filter all in changes feed</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Visual Multi-segment Progress Bar */}
        <div className="w-full h-3 bg-dark-950 rounded-full overflow-hidden flex border border-slate-800">
          {highPlusCritical > 0 && (
            <div
              style={{ width: `${highPct}%` }}
              className="bg-rose-500 h-full transition-all duration-300"
              title={`High/Critical: ${highPlusCritical} (${highPct}%)`}
            />
          )}
          {mediumCount > 0 && (
            <div
              style={{ width: `${medPct}%` }}
              className="bg-sky-500 h-full transition-all duration-300"
              title={`Medium: ${mediumCount} (${medPct}%)`}
            />
          )}
          {lowCount > 0 && (
            <div
              style={{ width: `${lowPct}%` }}
              className="bg-slate-500 h-full transition-all duration-300"
              title={`Low: ${lowCount} (${lowPct}%)`}
            />
          )}
        </div>

        {/* Breakdown Metric Cards */}
        <div className="grid grid-cols-3 gap-3">
          {/* High / Critical */}
          <div
            onClick={() => navigate('/changes?significance=high')}
            className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 cursor-pointer transition flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-300">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                <span>High & Critical</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Urgent market moves</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-rose-300">{highPlusCritical}</span>
              <p className="text-[10px] text-rose-400/80 font-medium">{highPct}%</p>
            </div>
          </div>

          {/* Medium */}
          <div
            onClick={() => navigate('/changes?significance=medium')}
            className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 cursor-pointer transition flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-300">
                <AlertTriangle className="w-3.5 h-3.5 text-sky-400" />
                <span>Medium</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Feature releases / updates</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-sky-300">{mediumCount}</span>
              <p className="text-[10px] text-sky-400/80 font-medium">{medPct}%</p>
            </div>
          </div>

          {/* Low */}
          <div
            onClick={() => navigate('/changes?significance=low')}
            className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 cursor-pointer transition flex items-center justify-between"
          >
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>Low</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">Routine blogs & copy</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black text-slate-200">{lowCount}</span>
              <p className="text-[10px] text-slate-400 font-medium">{lowPct}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Latest Competitive Signals (AI Insights from Gemini) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-white">
              Latest Competitive Signals
            </h3>
            <Badge variant="indigo" size="xs">Gemini 3.6 Flash</Badge>
          </div>

          <button
            onClick={() => navigate('/signals')}
            className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
          >
            <span>View all strategic signals</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {insights.length === 0 ? (
          <EmptyState
            title="No competitive signals generated yet"
            description="Use the Changes feed to trigger AI analysis on any detected change."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 2).map((ins) => {
              const compName =
                ins.changeId?.competitorId?.name || ins.competitorName || 'Competitor';
              const title =
                ins.changeId?.title || ins.changeTitle || 'Competitive Strategic Shift';
              const category = ins.changeId?.category || ins.category || 'product';

              return (
                <div
                  key={ins._id}
                  className="bg-dark-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs">{compName}</span>
                        <Badge variant={category} size="xs">{category}</Badge>
                      </div>
                      {ins.confidence !== undefined && (
                        <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {(ins.confidence * 100).toFixed(0)}% Confidence
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{title}</h4>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                      {ins.summary}
                    </p>
                  </div>

                  {ins.recommendedAction && (
                    <div className="pt-3 border-t border-slate-800/80 flex items-start gap-2 text-xs">
                      <Target className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="text-slate-300 text-[11px] line-clamp-2">
                        <strong className="text-emerald-400">Action:</strong> {ins.recommendedAction}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Clean "Recent Changes" Section & Competitor Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Clean Scannable Changes Feed */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Recent Changes Feed</span>
              <span className="text-xs text-slate-400 font-normal">
                ({changes.length} detected)
              </span>
            </h3>

            <button
              onClick={() => navigate('/changes')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
            >
              <span>Explore all</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <Card bodyClassName="p-0">
            {changes.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  title="No changes recorded yet"
                  description="The crawler will log new changes automatically upon content shifts."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {changes.slice(0, 5).map((change) => {
                  const isHigh =
                    change.significance === 'high' || change.significance === 'critical';
                  const isMed = change.significance === 'medium';

                  return (
                    <div
                      key={change._id}
                      onClick={() => navigate('/changes')}
                      className={`p-4 transition cursor-pointer hover:bg-slate-800/30 flex flex-col gap-2 border-l-4 ${
                        isHigh
                          ? 'border-l-rose-500 bg-rose-500/5'
                          : isMed
                          ? 'border-l-sky-500'
                          : 'border-l-slate-700'
                      }`}
                    >
                      {/* Row Top Header */}
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

                      {/* Title */}
                      <p className="text-xs font-semibold text-slate-100">
                        {change.title}
                      </p>

                      {/* Diff Preview */}
                      {(change.previousValue || change.newValue) && (
                        <div className="mt-1 text-[11px] font-mono p-2 rounded bg-dark-950/70 border border-slate-800/60 flex flex-col gap-0.5">
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
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Right 1 Col: Competitors Snapshot */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Tracked Competitors</h3>
            <button
              onClick={() => navigate('/landscape')}
              className="text-xs text-brand-400 hover:text-brand-300 font-medium"
            >
              Landscape
            </button>
          </div>

          <Card bodyClassName="p-3 space-y-2">
            {competitors.map((comp) => (
              <div
                key={comp._id}
                onClick={() => navigate(`/landscape/${comp._id}`)}
                className="p-3 rounded-lg border border-slate-800 bg-dark-950/40 hover:border-slate-700 hover:bg-slate-800/20 cursor-pointer transition flex items-center justify-between"
              >
                <div className="flex items-center gap-3 truncate mr-2">
                  <img
                    src={comp.logo}
                    alt={comp.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    className="w-7 h-7 rounded bg-slate-800 p-0.5 border border-slate-700 object-contain shrink-0"
                  />
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-white truncate">
                      {comp.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 truncate">{comp.category}</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
