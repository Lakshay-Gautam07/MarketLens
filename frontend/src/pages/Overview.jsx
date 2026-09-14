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
} from 'lucide-react';
import { api } from '../services/api';

export default function Overview() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [changes, setChanges] = useState([]);
  const [latestInsight, setLatestInsight] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [totalChangesCount, setTotalChangesCount] = useState(0);

  const fetchOverviewData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [compRes, changeRes, insightRes, reportRes] = await Promise.all([
        api.competitors.getAll({ limit: 10 }),
        api.changes.getAll({ limit: 5 }),
        api.insights.getAll({ limit: 1 }),
        api.reports.getAll({ limit: 1 }),
      ]);

      setCompetitors(compRes.data || []);
      setChanges(changeRes.data || []);
      setTotalChangesCount(changeRes.pagination?.total || changeRes.data?.length || 0);
      setLatestInsight(insightRes.data?.[0] || null);
      setLatestReport(reportRes.data?.[0] || null);
    } catch (err) {
      console.error('Error fetching overview data:', err);
      setError(err.message || 'Failed to load live data from backend');
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
        <LoadingSpinner message="Fetching intelligence metrics from MongoDB..." />
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

  const criticalSignalsCount = changes.filter(
    (c) => c.significance === 'critical' || c.significance === 'high'
  ).length;

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Intelligence Overview"
        breadcrumbs={['Dashboard']}
      />

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Competitors"
          value={competitors.filter((c) => c.active !== false).length}
          change={`${competitors.length} total`}
          changeType="positive"
          icon={Compass}
          description="Monitored in MongoDB"
          accentColor="brand"
        />
        <StatCard
          title="Live Changes"
          value={totalChangesCount}
          change="Updated live"
          changeType="positive"
          icon={GitCommit}
          description="Logged crawler diffs"
          accentColor="cyan"
        />
        <StatCard
          title="Signals Generated"
          value={latestInsight ? 'Active' : 'Standby'}
          change="Gemini 3.6 Flash"
          changeType="positive"
          icon={TrendingUp}
          description="Strategic analysis"
          accentColor="emerald"
        />
        <StatCard
          title="High Urgency Moves"
          value={criticalSignalsCount}
          change={criticalSignalsCount > 0 ? 'Requires attention' : 'Nominal'}
          changeType={criticalSignalsCount > 0 ? 'negative' : 'positive'}
          icon={ShieldAlert}
          description="High or critical level"
          accentColor="rose"
        />
      </div>

      {/* High-priority AI Strategic Alert Banner */}
      {latestInsight && (
        <div className="relative overflow-hidden rounded-xl border border-brand-500/40 bg-gradient-to-r from-brand-950/70 via-dark-900 to-dark-900 p-5 glow-brand">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Gemini Strategic Pulse
                </span>
                <Badge variant={latestInsight.changeId?.significance || 'high'}>
                  {latestInsight.changeId?.significance || 'High'} Urgency
                </Badge>
                {latestInsight.confidence !== undefined && (
                  <span className="text-xs text-slate-400">
                    Confidence: {(latestInsight.confidence * 100).toFixed(0)}%
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-white">
                {latestInsight.changeId?.competitorId?.name || 'Competitor'}:{' '}
                {latestInsight.changeId?.title || 'Competitive Shift'}
              </h3>
              <p className="text-xs text-slate-300 line-clamp-2 max-w-4xl">
                {latestInsight.summary}
              </p>
            </div>
            <button
              onClick={() => navigate('/signals')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-lg shadow-brand-500/20 transition whitespace-nowrap"
            >
              <span>View Strategic Action Plan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Two Column Layout: Recent Changes & Competitor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recent Detected Changes */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Recent Competitive Movements"
            subtitle="Live feed of crawler detections across monitored public sources"
            action={
              <button
                onClick={() => navigate('/changes')}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
              >
                <span>View all changes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            }
          >
            {changes.length === 0 ? (
              <EmptyState
                title="No changes recorded yet"
                description="The competitor monitoring crawler hasn't detected any content shifts yet."
              />
            ) : (
              <div className="divide-y divide-slate-800/60">
                {changes.map((change) => (
                  <div
                    key={change._id}
                    onClick={() => navigate('/changes')}
                    className="py-3.5 first:pt-0 last:pb-0 group cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white group-hover:text-brand-400 transition">
                          {change.competitorId?.name || 'Competitor'}
                        </span>
                        <Badge variant={change.category}>{change.category}</Badge>
                        <Badge variant={change.significance}>{change.significance}</Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(change.detectedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-slate-200 group-hover:text-slate-100">
                      {change.title}
                    </p>

                    {(change.previousValue || change.newValue) && (
                      <div className="mt-2 text-[11px] text-slate-400 bg-dark-950/60 p-2 rounded-lg border border-slate-800/50 flex flex-col gap-1 font-mono">
                        {change.previousValue && (
                          <div className="text-rose-400 line-through truncate">
                            - {change.previousValue}
                          </div>
                        )}
                        {change.newValue && (
                          <div className="text-emerald-400 truncate">
                            + {change.newValue}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Latest Weekly Report Card */}
          {latestReport && (
            <Card
              title={
                latestReport.keyChanges?.[0]
                  ? 'Weekly Intelligence Digest'
                  : 'Weekly Report'
              }
              subtitle={`Week of ${new Date(latestReport.weekStart).toLocaleDateString()} — ${new Date(latestReport.weekEnd).toLocaleDateString()}`}
              action={
                <button
                  onClick={() => navigate('/reports')}
                  className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                >
                  <span>Full report</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              <div className="space-y-3">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Key Highlights
                  </h4>
                  {latestReport.keyChanges?.slice(0, 3).map((kc, i) => (
                    <div key={i} className="text-xs text-slate-300 flex items-start gap-2">
                      <span className="text-brand-400 font-bold">•</span>
                      <span>{kc}</span>
                    </div>
                  ))}
                </div>

                {latestReport.strategicSignals?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60">
                    <span className="text-[11px] font-semibold text-amber-400">
                      Signals:{' '}
                    </span>
                    <span className="text-xs text-slate-400">
                      {latestReport.strategicSignals[0]}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Monitored Competitors Pulse */}
        <div className="space-y-6">
          <Card
            title="Tracked Competitors"
            subtitle="Active posture in MongoDB"
            action={
              <button
                onClick={() => navigate('/landscape')}
                className="text-xs text-brand-400 hover:text-brand-300 font-medium"
              >
                Manage
              </button>
            }
          >
            <div className="space-y-3">
              {competitors.map((comp) => (
                <div
                  key={comp._id}
                  onClick={() => navigate(`/landscape/${comp._id}`)}
                  className="p-3 rounded-lg border border-slate-800 bg-dark-950/40 hover:border-slate-700 hover:bg-slate-800/20 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={comp.logo}
                      alt={comp.name}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                      className="w-7 h-7 rounded bg-slate-800 p-0.5 border border-slate-700 object-contain"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        {comp.name}
                        <Badge
                          variant={comp.active !== false ? 'emerald' : 'slate'}
                          size="xs"
                        >
                          {comp.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </h4>
                      <p className="text-[10px] text-slate-400">{comp.category}</p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400" />
                </div>
              ))}
            </div>
          </Card>

          {/* Quick System Health */}
          <Card title="Crawl Engine Status">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Scheduler</span>
                <span className="font-mono text-emerald-400">0 */6 * * * (Active)</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Database</span>
                <span className="text-emerald-400 font-medium">Connected</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-slate-400">AI Synthesizer</span>
                <span className="text-amber-400 font-medium">Gemini 3.6 Flash</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
