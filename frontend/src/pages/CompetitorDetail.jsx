import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import DataTable from '../components/common/DataTable';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState, EmptyState } from '../components/common/EmptyState';
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
import { api } from '../services/api';

export default function CompetitorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitor, setCompetitor] = useState(null);
  const [sources, setSources] = useState([]);
  const [changes, setChanges] = useState([]);
  const [pricingSnapshot, setPricingSnapshot] = useState(null);
  const [insights, setInsights] = useState([]);
  const [activeTab, setActiveTab] = useState('sources');

  const fetchCompetitorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch competitor details with sources
      const compRes = await api.competitors.getById(id);
      const compData = compRes.data;
      setCompetitor(compData);
      setSources(compData.sources || []);

      // 2. Fetch changes, pricing, and insights in parallel
      const [changeRes, priceRes, insightRes] = await Promise.allSettled([
        api.changes.getAll({ competitorId: id }),
        api.pricing.getByCompetitorId(id),
        api.insights.getAll({ limit: 50 }),
      ]);

      if (changeRes.status === 'fulfilled') {
        setChanges(changeRes.value.data || []);
      }
      if (priceRes.status === 'fulfilled') {
        setPricingSnapshot(priceRes.value.data?.latest || null);
      }
      if (insightRes.status === 'fulfilled') {
        // Filter insights associated with this competitor
        const allInsights = insightRes.value.data || [];
        const compInsights = allInsights.filter(
          (ins) =>
            ins.changeId?.competitorId?._id === id ||
            ins.changeId?.competitorId === id ||
            ins.competitorName === compData.name
        );
        setInsights(compInsights);
      }
    } catch (err) {
      console.error('Error fetching competitor details:', err);
      setError(err.message || 'Failed to load competitor details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCompetitorData();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Competitor Dossier"
          breadcrumbs={['Landscape', 'Loading...']}
        />
        <LoadingSpinner message="Fetching competitor intelligence records..." />
      </div>
    );
  }

  if (error || !competitor) {
    return (
      <div className="space-y-6">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Competitor Dossier"
          breadcrumbs={['Landscape', 'Error']}
        />
        <ErrorState
          title="Competitor Not Found"
          message={error || 'Unable to find competitor with the requested ID.'}
          onRetry={fetchCompetitorData}
        />
      </div>
    );
  }

  const tabs = [
    { id: 'sources', label: `Monitored Sources (${sources.length})`, icon: Radio },
    { id: 'changes', label: `Changes (${changes.length})`, icon: GitCommit },
    { id: 'pricing', label: `Pricing Tiers ${pricingSnapshot ? `(${pricingSnapshot.plans?.length || 0})` : ''}`, icon: CircleDollarSign },
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
      key: 'lastCheckedAt',
      render: (row) => (
        <span className="text-xs text-slate-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          {row.lastCheckedAt ? new Date(row.lastCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending'}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'active',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
            row.active !== false ? 'text-emerald-400' : 'text-slate-500'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              row.active !== false ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          />
          {row.active !== false ? 'Active' : 'Paused'}
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
                <Badge variant={competitor.active !== false ? 'emerald' : 'slate'}>
                  {competitor.active !== false ? 'Active Monitoring' : 'Inactive'}
                </Badge>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">{competitor.category}</p>
            </div>
          </div>

          {competitor.website && (
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
          )}
        </div>

        {competitor.description && (
          <p className="text-xs text-slate-300 mt-4 leading-relaxed max-w-4xl">
            {competitor.description}
          </p>
        )}

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
          {sources.length === 0 ? (
            <EmptyState
              title="No sources registered"
              description="No public URLs are currently configured for this competitor."
            />
          ) : (
            <DataTable columns={sourceColumns} data={sources} />
          )}
        </Card>
      )}

      {activeTab === 'changes' && (
        <Card
          title="Detected Change History"
          subtitle="Chronological feed of diffs logged for this competitor in MongoDB"
        >
          {changes.length === 0 ? (
            <EmptyState
              title="No changes recorded"
              description="No content modifications have been detected for this competitor yet."
            />
          ) : (
            <div className="space-y-4">
              {changes.map((c) => (
                <div
                  key={c._id}
                  className="p-4 rounded-lg bg-dark-950/60 border border-slate-800/80 space-y-2"
                >
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
                  {(c.previousValue || c.newValue) && (
                    <div className="mt-2 text-[11px] font-mono p-2.5 rounded bg-dark-900 border border-slate-800 text-slate-300 space-y-1">
                      {c.previousValue && (
                        <div className="text-rose-400">- {c.previousValue}</div>
                      )}
                      {c.newValue && (
                        <div className="text-emerald-400">+ {c.newValue}</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Current Pricing Structure</h3>
              <p className="text-xs text-slate-400">
                Captured:{' '}
                {pricingSnapshot
                  ? new Date(pricingSnapshot.capturedAt).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Currency: {pricingSnapshot?.currency || 'USD'}
            </span>
          </div>

          {!pricingSnapshot || !pricingSnapshot.plans || pricingSnapshot.plans.length === 0 ? (
            <EmptyState
              title="No pricing snapshot available"
              description="No pricing tier information has been captured for this competitor yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pricingSnapshot.plans.map((plan, i) => (
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
                      {plan.features?.map((feat, idx) => (
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
          )}
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="space-y-4">
          {insights.length === 0 ? (
            <EmptyState
              title="No AI insights available"
              description="No Gemini strategic assessments have been generated for this competitor yet."
            />
          ) : (
            insights.map((ins) => (
              <Card
                key={ins._id}
                title={ins.changeId?.title || ins.changeTitle || 'Strategic Insight'}
                subtitle={`Generated via Gemini 3.6 Flash • Confidence ${
                  ins.confidence !== undefined ? (ins.confidence * 100).toFixed(0) : 85
                }%`}
                glow
              >
                <div className="space-y-4 text-xs">
                  <div>
                    <h5 className="font-semibold text-slate-200 mb-1 text-xs uppercase tracking-wider text-brand-400">
                      Strategic Summary
                    </h5>
                    <p className="text-slate-300 leading-relaxed">{ins.summary}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="p-3 rounded-lg bg-dark-950 border border-slate-800">
                      <h5 className="font-semibold text-rose-400 mb-1">
                        Competitor Advantage Gained
                      </h5>
                      <p className="text-slate-300">{ins.competitorAdvantage}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-dark-950 border border-slate-800">
                      <h5 className="font-semibold text-emerald-400 mb-1">
                        Recommended Response
                      </h5>
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
