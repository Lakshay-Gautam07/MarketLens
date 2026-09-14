import React from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import StatCard from '../components/common/StatCard';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import {
  Compass,
  GitCommit,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  mockCompetitors,
  mockChanges,
  mockInsights,
  mockWeeklyReports,
  mockOverviewStats,
} from '../data/mockData';

export default function Overview() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();
  const latestInsight = mockInsights[0];
  const latestReport = mockWeeklyReports[0];

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
          value={mockOverviewStats.activeCompetitors}
          change="+1 this month"
          changeType="positive"
          icon={Compass}
          description="Across 4 market segments"
          accentColor="brand"
        />
        <StatCard
          title="Sources Tracked"
          value={mockOverviewStats.sourcesMonitored}
          change="100% healthy"
          changeType="positive"
          icon={GitCommit}
          description="Pricing, blogs, changelogs"
          accentColor="cyan"
        />
        <StatCard
          title="Changes (30d)"
          value={mockOverviewStats.changesDetected30d}
          change="+18% vs last mo"
          changeType="positive"
          icon={TrendingUp}
          description="34 product, 18 pricing"
          accentColor="emerald"
        />
        <StatCard
          title="Critical Signals"
          value={mockOverviewStats.criticalSignals7d}
          change="2 require action"
          changeType="negative"
          icon={ShieldAlert}
          description="High strategic urgency"
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
                <Badge variant="critical">High Urgency</Badge>
                <span className="text-xs text-slate-400">Confidence: {(latestInsight.confidence * 100).toFixed(0)}%</span>
              </div>
              <h3 className="text-base font-bold text-white">
                {latestInsight.competitorName}: {latestInsight.changeTitle}
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
            <div className="divide-y divide-slate-800/60">
              {mockChanges.slice(0, 4).map((change) => (
                <div
                  key={change._id}
                  onClick={() => navigate('/changes')}
                  className="py-3.5 first:pt-0 last:pb-0 group cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white group-hover:text-brand-400 transition">
                        {change.competitorId.name}
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

                  <div className="mt-2 text-[11px] text-slate-400 bg-dark-950/60 p-2 rounded-lg border border-slate-800/50 flex flex-col gap-1 font-mono">
                    <div className="text-rose-400 line-through truncate">
                      - {change.previousValue}
                    </div>
                    <div className="text-emerald-400 truncate">
                      + {change.newValue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Latest Weekly Report Card */}
          {latestReport && (
            <Card
              title={latestReport.title}
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
              <p className="text-xs text-slate-300 leading-relaxed">
                {latestReport.executiveSummary}
              </p>
              <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap gap-2">
                {latestReport.keyChanges.slice(0, 2).map((kc, i) => (
                  <div key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5 w-full">
                    <span className="text-brand-400 font-bold">•</span>
                    <span>{kc}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right 1 Col: Monitored Competitors Pulse */}
        <div className="space-y-6">
          <Card
            title="Tracked Competitors"
            subtitle="Active posture & threat levels"
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
              {mockCompetitors.map((comp) => (
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
                          variant={comp.threatLevel === 'High' ? 'critical' : 'medium'}
                          size="xs"
                        >
                          {comp.threatLevel}
                        </Badge>
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {comp.trackedSourcesCount} sources • {comp.lastActivity}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-200">
                      {comp.changeCount30d}
                    </span>
                    <p className="text-[9px] text-slate-500 uppercase font-medium">30d diffs</p>
                  </div>
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
                <span className="text-slate-400">Last Execution</span>
                <span className="text-slate-200">{mockOverviewStats.lastCronRun}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Next Cycle</span>
                <span className="text-slate-200">{mockOverviewStats.nextScheduledRun}</span>
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
