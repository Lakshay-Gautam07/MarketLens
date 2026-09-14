import React, { useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import DataTable from '../components/common/DataTable';
import {
  ExternalLink,
  ArrowLeft,
  Globe,
  GitCommit,
  Sparkles,
  CircleDollarSign,
  Radio,
  Clock,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import {
  mockCompetitors,
  mockSources,
  mockChanges,
  mockInsights,
  mockPricingSnapshots,
} from '../data/mockData';

export default function CompetitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();
  const [activeTab, setActiveTab] = useState('sources');

  // Find competitor by ID or fallback to first
  const competitor = mockCompetitors.find((c) => c._id === id) || mockCompetitors[0];
  const sources = mockSources.filter((s) => s.competitorId === competitor._id);
  const changes = mockChanges.filter((c) => c.competitorId.name === competitor.name);
  const insights = mockInsights.filter((i) => i.competitorName === competitor.name);
  const pricing = mockPricingSnapshots.find((p) => p.competitorName === competitor.name);

  const tabs = [
    { id: 'sources', label: `Monitored Sources (${sources.length})`, icon: Radio },
    { id: 'changes', label: `Changes (${changes.length})`, icon: GitCommit },
    { id: 'pricing', label: 'Pricing Tiers', icon: CircleDollarSign },
    { id: 'insights', label: `AI Insights (${insights.length})`, icon: Sparkles },
  ];

  const sourceColumns = [
    {
      header: 'Source Name',
      key: 'name',
      render: (row) => (
        <div>
          <p className="font-semibold text-white text-xs">{row.name}</p>
          <a
            href={row.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-brand-400 hover:underline inline-flex items-center gap-1 mt-0.5"
          >
            <span className="truncate max-w-xs">{row.url}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      render: (row) => <Badge variant={row.type}>{row.type}</Badge>,
    },
    {
      header: 'Last Checked',
      key: 'lastChecked',
      render: (row) => (
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {row.lastChecked}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: () => (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          Active
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title={competitor.name}
        breadcrumbs={['Landscape', competitor.name]}
      />

      {/* Back button & Hero summary card */}
      <div className="bg-dark-900 border border-slate-800/80 rounded-xl p-6">
        <button
          onClick={() => navigate('/landscape')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Competitive Landscape</span>
        </button>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={competitor.logo}
              alt={competitor.name}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
              className="w-14 h-14 rounded-xl bg-slate-800 p-2 border border-slate-700 object-contain shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{competitor.name}</h2>
                <Badge variant={competitor.threatLevel === 'High' ? 'critical' : 'medium'}>
                  {competitor.threatLevel} Threat
                </Badge>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{competitor.category}</p>
            </div>
          </div>

          <a
            href={competitor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-dark-950 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold transition"
          >
            <Globe className="w-4 h-4 text-slate-400" />
            <span>Visit Website</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>

        <p className="text-xs text-slate-300 mt-4 leading-relaxed max-w-4xl">
          {competitor.description}
        </p>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-800/80 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-brand-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'sources' && (
        <Card
          title="Monitored Endpoint Sources"
          subtitle="Publicly tracked URLs automatically scanned for content modifications"
        >
          <DataTable columns={sourceColumns} data={sources} />
        </Card>
      )}

      {activeTab === 'changes' && (
        <Card
          title="Detected Change History"
          subtitle="Chronological feed of diffs logged for this competitor"
        >
          <div className="space-y-4">
            {changes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No changes recorded yet.</p>
            ) : (
              changes.map((c) => (
                <div key={c._id} className="p-4 rounded-lg bg-dark-950/60 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={c.category}>{c.category}</Badge>
                      <Badge variant={c.significance}>{c.significance}</Badge>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {new Date(c.detectedAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-white">{c.title}</h4>
                  <p className="text-xs text-slate-300">{c.description}</p>
                  <div className="mt-2 text-[11px] font-mono p-2.5 rounded bg-dark-900 border border-slate-800 text-slate-300 space-y-1">
                    <div className="text-rose-400">- {c.previousValue}</div>
                    <div className="text-emerald-400">+ {c.newValue}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Current Pricing Structure</h3>
              <p className="text-xs text-slate-400">Captured: {pricing ? new Date(pricing.capturedAt).toLocaleDateString() : 'Recent'}</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Currency: USD</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {pricing?.plans.map((plan, i) => (
              <div
                key={i}
                className="bg-dark-900 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                    {plan.isFree && <Badge variant="slate" size="xs">Free Tier</Badge>}
                    {plan.isEnterprise && <Badge variant="indigo" size="xs">Enterprise</Badge>}
                  </div>

                  <div className="my-3">
                    {plan.price !== null ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-white">${plan.price}</span>
                        <span className="text-xs text-slate-400">/ user / mo</span>
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-slate-200">Custom Contact</span>
                    )}
                  </div>

                  <ul className="space-y-2 mt-4 text-xs text-slate-300">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <p className="text-xs text-slate-400 py-6 text-center">No AI insights generated yet for this competitor.</p>
            </Card>
          ) : (
            insights.map((ins) => (
              <Card
                key={ins._id}
                title={ins.changeTitle}
                subtitle={`Generated via Gemini 3.6 Flash • Confidence ${(ins.confidence * 100).toFixed(0)}%`}
                glow
              >
                <div className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-semibold text-slate-200 mb-1 text-xs uppercase tracking-wider text-brand-400">Strategic Summary</h5>
                    <p className="text-slate-300 leading-relaxed">{ins.summary}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-3 rounded-lg bg-dark-950 border border-slate-800">
                      <h5 className="font-semibold text-rose-400 mb-1">Competitor Advantage Gained</h5>
                      <p className="text-slate-300">{ins.competitorAdvantage}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-dark-950 border border-slate-800">
                      <h5 className="font-semibold text-emerald-400 mb-1">Recommended Response</h5>
                      <p className="text-slate-300">{ins.recommendedAction}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}
