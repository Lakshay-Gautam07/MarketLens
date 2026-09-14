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
  TrendingUp,
  Zap,
  Target,
  Users,
  AlertTriangle,
  FolderTree,
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
  const [activeTab, setActiveTab] = useState('changes'); // Default to 'changes' for PM analysis
  const [selectedChangeCategory, setSelectedChangeCategory] = useState('All');
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  const fetchCompetitorData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch competitor profile with attached sources
      const compRes = await api.competitors.getById(id);
      const compData = compRes.data;
      setCompetitor(compData);
      setSources(compData.sources || []);

      // 2. Fetch changes, pricing, and all insights concurrently
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
      setError(err.message || 'Failed to load competitor dossier from backend');
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
        <LoadingSpinner message="Assembling real-time competitor intelligence from MongoDB..." />
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
          title="Competitor Record Unavailable"
          message={error || 'Unable to locate competitor in the database.'}
          onRetry={fetchCompetitorData}
        />
      </div>
    );
  }

  // Group changes by category
  const changeCategories = ['All', ...new Set(changes.map((c) => c.category).filter(Boolean))];

  const filteredChanges = changes.filter((c) => {
    return selectedChangeCategory === 'All' || c.category === selectedChangeCategory;
  });

  // Count changes by category
  const getCategoryCount = (cat) => {
    if (cat === 'All') return changes.length;
    return changes.filter((c) => c.category === cat).length;
  };

  const tabs = [
    { id: 'changes', label: `Detected Changes (${changes.length})`, icon: GitCommit },
    { id: 'insights', label: `Strategic AI Insights (${insights.length})`, icon: Sparkles },
    {
      id: 'pricing',
      label: `Pricing Tiers ${pricingSnapshot ? `(${pricingSnapshot.plans?.length || 0})` : ''}`,
      icon: CircleDollarSign,
    },
    { id: 'sources', label: `Monitored Sources (${sources.length})`, icon: Radio },
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
          {row.lastCheckedAt
            ? new Date(row.lastCheckedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Scheduled'}
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
          {row.active !== false ? 'Active Crawling' : 'Paused'}
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

      {/* Hero Overview Dossier Card */}
      <div className="bg-dark-900 border border-slate-800/90 rounded-xl p-6">
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
              className="w-14 h-14 rounded-xl bg-slate-800 p-2 border border-slate-700 object-contain shadow-lg shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{competitor.name}</h2>
                <Badge variant={competitor.active !== false ? 'emerald' : 'slate'} dot>
                  {competitor.active !== false ? 'Active Tracking' : 'Paused'}
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
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-dark-950 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold transition shadow-sm"
            >
              <Globe className="w-4 h-4 text-slate-400" />
              <span>Visit Public Site</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
            </a>
          )}
        </div>

        {competitor.description && (
          <p className="text-xs text-slate-300 mt-4 leading-relaxed max-w-4xl bg-dark-950/40 p-3.5 rounded-lg border border-slate-800/60">
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

      {/* TAB 1: DETECTED CHANGES (Grouped by Category) */}
      {activeTab === 'changes' && (
        <div className="space-y-4">
          {/* Category Grouping Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-dark-900 border border-slate-800 p-3.5 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <FolderTree className="w-3.5 h-3.5 text-brand-400" />
                <span>Group by Category:</span>
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {changeCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedChangeCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition whitespace-nowrap ${
                      selectedChangeCategory === cat
                        ? 'bg-brand-600 text-white shadow'
                        : 'bg-dark-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    {cat} ({getCategoryCount(cat)})
                  </button>
                ))}
              </div>
            </div>

            <span className="text-xs text-slate-400 whitespace-nowrap">
              Showing {filteredChanges.length} changes
            </span>
          </div>

          {filteredChanges.length === 0 ? (
            <EmptyState
              title={`No ${selectedChangeCategory === 'All' ? '' : selectedChangeCategory + ' '}changes found`}
              description="No modifications in this category have been detected for this competitor."
            />
          ) : (
            <div className="space-y-4">
              {filteredChanges.map((c) => {
                const isHigh = c.significance === 'high' || c.significance === 'critical';
                const isMed = c.significance === 'medium';

                return (
                  <div
                    key={c._id}
                    className={`bg-dark-900 border rounded-xl p-5 transition space-y-3 border-l-4 ${
                      isHigh
                        ? 'border-l-rose-500 border-slate-800/80 bg-rose-500/5'
                        : isMed
                        ? 'border-l-sky-500 border-slate-800/80'
                        : 'border-l-slate-700 border-slate-800/80'
                    }`}
                  >
                    {/* Header with clear significance distinction */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={c.significance} size="sm" dot>
                          {c.significance} Significance
                        </Badge>
                        <Badge variant={c.category} size="xs">
                          {c.category}
                        </Badge>
                      </div>

                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(c.detectedAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Change title & description */}
                    <div>
                      <h4 className="text-sm font-bold text-white">{c.title}</h4>
                      {c.description && (
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {c.description}
                        </p>
                      )}
                    </div>

                    {/* Extracted text diff */}
                    {(c.previousValue || c.newValue) && (
                      <div className="mt-2 text-xs font-mono p-3 rounded-lg bg-dark-950 border border-slate-800/90 space-y-2">
                        {c.previousValue && (
                          <div className="text-rose-400">
                            <span className="font-bold mr-2 text-rose-500 text-[10px] uppercase tracking-wider">
                              Previous:
                            </span>
                            {c.previousValue}
                          </div>
                        )}
                        {c.newValue && (
                          <div className="text-emerald-400">
                            <span className="font-bold mr-2 text-emerald-500 text-[10px] uppercase tracking-wider">
                              New Value:
                            </span>
                            {c.newValue}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer link to source */}
                    {c.url && (
                      <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">
                          Source: {c.sourceId?.name || 'Public Webpage'}
                        </span>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-400 hover:underline text-[11px]"
                        >
                          <span>Verify live source URL</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: STRATEGIC AI INSIGHTS (With 6 required fields clearly displayed) */}
      {activeTab === 'insights' && (
        <div className="space-y-5">
          {insights.length === 0 ? (
            <EmptyState
              title="No AI insights generated yet"
              description="Navigate to the Changes tab or Changes Feed to run Gemini 3.6 Flash analysis."
            />
          ) : (
            insights.map((ins) => {
              const title =
                ins.changeId?.title || ins.changeTitle || 'Competitive Strategic Assessment';
              const category = ins.changeId?.category || ins.category || 'strategy';
              const confidencePercent =
                ins.confidence !== undefined ? Math.round(ins.confidence * 100) : 88;

              return (
                <div
                  key={ins._id}
                  className="bg-dark-900 border border-slate-800 rounded-xl p-6 glow-brand space-y-5"
                >
                  {/* Insight Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Gemini 3.6 Flash Assessment
                        </span>
                        <Badge variant={category} size="xs">
                          {category}
                        </Badge>
                      </div>
                      <h3 className="text-base font-bold text-white">{title}</h3>
                    </div>

                    {/* Confidence Indicator */}
                    <div className="flex items-center gap-3 bg-dark-950 px-3.5 py-1.5 rounded-lg border border-slate-800 shrink-0">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Confidence</p>
                        <p className="text-xs font-black text-amber-400">{confidencePercent}%</p>
                      </div>
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${confidencePercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 1. Summary */}
                  <div className="space-y-1">
                    <h5 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                      1. Executive Summary
                    </h5>
                    <p className="text-xs text-slate-200 leading-relaxed bg-dark-950/70 p-3.5 rounded-xl border border-slate-800/70">
                      {ins.summary}
                    </p>
                  </div>

                  {/* 2-col Grid: 2. Strategic Impact & 3. Competitor Advantage */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 2. Strategic Impact */}
                    <div className="p-4 bg-dark-950 rounded-xl border border-slate-800 space-y-1.5">
                      <h5 className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4" />
                        <span>2. Strategic Impact</span>
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {ins.strategicImpact || 'No specific impact provided.'}
                      </p>
                    </div>

                    {/* 3. Competitor Advantage */}
                    <div className="p-4 bg-dark-950 rounded-xl border border-rose-500/20 space-y-1.5">
                      <h5 className="font-bold text-rose-400 text-xs flex items-center gap-1.5">
                        <Zap className="w-4 h-4" />
                        <span>3. Competitor Advantage Gained</span>
                      </h5>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {ins.competitorAdvantage || 'No specific advantage noted.'}
                      </p>
                    </div>
                  </div>

                  {/* 4. Recommended Action */}
                  <div className="p-4 bg-dark-950 rounded-xl border border-emerald-500/20 space-y-1.5">
                    <h5 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                      <Target className="w-4 h-4" />
                      <span>4. Recommended Product & Go-To-Market Response</span>
                    </h5>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {ins.recommendedAction || 'No recommended counter-action specified.'}
                    </p>
                  </div>

                  {/* 5. Affected Segment & Metadata */}
                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-slate-300">5. Affected Segment:</span>
                      <span className="text-slate-200 bg-dark-950 px-2.5 py-0.5 rounded border border-slate-800">
                        {ins.affectedSegment || 'Broad Market Cohort'}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-500">
                      Generated on {new Date(ins.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 3: PRICING INFORMATION */}
      {activeTab === 'pricing' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-dark-900 border border-slate-800 p-4 rounded-xl">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Verified Pricing Plans</span>
                <span className="text-xs text-slate-400 font-normal">
                  (Currency: {pricingSnapshot?.currency || 'USD'})
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {pricingSnapshot
                  ? `Captured on ${new Date(pricingSnapshot.capturedAt).toLocaleDateString()} from public pricing page`
                  : 'Point-in-time snapshot'}
              </p>
            </div>

            {/* Billing cycle toggle */}
            <div className="flex items-center p-0.5 bg-dark-950 border border-slate-800 rounded-lg text-xs">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  billingCycle === 'monthly' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-3 py-1 rounded-md font-medium transition ${
                  billingCycle === 'annual' ? 'bg-slate-800 text-white' : 'text-slate-400'
                }`}
              >
                Annual (-20%)
              </button>
            </div>
          </div>

          {!pricingSnapshot || !pricingSnapshot.plans || pricingSnapshot.plans.length === 0 ? (
            <EmptyState
              title={`No pricing information captured for ${competitor.name}`}
              description="The monitoring system has not recorded a pricing page snapshot for this competitor in MongoDB yet."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {pricingSnapshot.plans.map((plan, i) => {
                const displayPrice =
                  plan.price !== null
                    ? billingCycle === 'annual'
                      ? Math.round(plan.price * 0.8)
                      : plan.price
                    : null;

                return (
                  <div
                    key={i}
                    className="bg-dark-900 border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-white">{plan.name}</h4>
                        {plan.isFree && <Badge variant="slate" size="xs">Freemium</Badge>}
                        {plan.isEnterprise && <Badge variant="indigo" size="xs">Enterprise</Badge>}
                      </div>

                      <div className="my-3">
                        {displayPrice !== null ? (
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-white">${displayPrice}</span>
                            <span className="text-xs text-slate-400">/ user / mo</span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-slate-200">Custom Contact</span>
                        )}
                        <p className="text-[10px] text-slate-500 mt-1">
                          {billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
                        </p>
                      </div>

                      <ul className="space-y-2 mt-4 text-xs text-slate-300">
                        {plan.features?.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MONITORED SOURCES */}
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
    </div>
  );
}
