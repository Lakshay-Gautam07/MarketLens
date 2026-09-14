import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState, EmptyState } from '../components/common/EmptyState';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Layers,
  History,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Building2,
  DollarSign,
} from 'lucide-react';
import { api } from '../services/api';

export default function Pricing() {
  const { setSidebarOpen } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState(null);
  const [activeSnapshot, setActiveSnapshot] = useState(null);
  const [historySnapshots, setHistorySnapshots] = useState([]);
  const [allLatestSnapshots, setAllLatestSnapshots] = useState([]);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'
  const [activeTab, setActiveTab] = useState('deep-dive'); // 'deep-dive' | 'comparison-matrix'
  const [fetchingDetails, setFetchingDetails] = useState(false);

  // 1. Fetch initial competitors list and all latest snapshots for comparison matrix
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [compsRes, allPricingRes] = await Promise.all([
          api.competitors.getAll(),
          api.pricing.getAll({ limit: 100 }),
        ]);

        const comps = compsRes.data || [];
        setCompetitors(comps);
        if (comps.length > 0) {
          setSelectedCompetitorId(comps[0]._id);
        }

        // Aggregate latest snapshot per competitor for the Cross-Competitor Matrix
        const rawSnapshots = allPricingRes.data || [];
        const latestByComp = {};
        rawSnapshots.forEach((snap) => {
          const cId = snap.competitorId?._id || snap.competitorId;
          if (!cId) return;
          // Because API returns sorted by capturedAt: -1, first encounter is latest
          if (!latestByComp[cId]) {
            latestByComp[cId] = snap;
          }
        });
        setAllLatestSnapshots(latestByComp);
      } catch (err) {
        console.error('Failed to load initial pricing data:', err);
        setError(err.message || 'Failed to connect to backend pricing service');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  // 2. Fetch pricing snapshots & history for selected competitor
  useEffect(() => {
    if (!selectedCompetitorId) return;

    const loadPricing = async () => {
      setFetchingDetails(true);
      try {
        const res = await api.pricing.getByCompetitorId(selectedCompetitorId);
        setActiveSnapshot(res.data?.latest || null);
        setHistorySnapshots(res.data?.history || []);
      } catch (err) {
        console.error('Failed to fetch pricing for competitor:', err);
        setActiveSnapshot(null);
        setHistorySnapshots([]);
      } finally {
        setFetchingDetails(false);
      }
    };
    loadPricing();
  }, [selectedCompetitorId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Pricing Intelligence"
          breadcrumbs={['Pricing Intelligence']}
        />
        <LoadingSpinner message="Fetching pricing snapshots and history from MongoDB..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title="Pricing Intelligence"
          breadcrumbs={['Pricing Intelligence']}
        />
        <ErrorState
          title="Pricing Data Unavailable"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const selectedCompetitor = competitors.find((c) => c._id === selectedCompetitorId);

  // Identify previous snapshot in history for diffing
  const previousSnapshot = historySnapshots.length > 1 ? historySnapshots[1] : null;

  // Helper to compute plan delta against previous snapshot
  const getPlanDelta = (currentPlan) => {
    if (!previousSnapshot || !previousSnapshot.plans) return null;
    const prevPlan = previousSnapshot.plans.find(
      (p) => p.name.toLowerCase().trim() === currentPlan.name.toLowerCase().trim()
    );

    if (!prevPlan) {
      return { type: 'new', label: 'New Tier' };
    }

    if (currentPlan.price === null || prevPlan.price === null) {
      return null;
    }

    const diff = currentPlan.price - prevPlan.price;
    if (diff > 0) {
      const pct = prevPlan.price > 0 ? Math.round((diff / prevPlan.price) * 100) : 100;
      return {
        type: 'increase',
        diff,
        pct,
        prevPrice: prevPlan.price,
        label: `+$${diff} (+${pct}%)`,
      };
    } else if (diff < 0) {
      const pct = Math.round((Math.abs(diff) / prevPlan.price) * 100);
      return {
        type: 'decrease',
        diff,
        pct,
        prevPrice: prevPlan.price,
        label: `-$${Math.abs(diff)} (-${pct}%)`,
      };
    } else {
      return { type: 'unchanged', label: 'Unchanged' };
    }
  };

  // Check if any plan had a price hike or drop across current snapshot
  const notableChanges = activeSnapshot?.plans?.map((p) => ({
    planName: p.name,
    delta: getPlanDelta(p),
  })).filter((item) => item.delta && item.delta.type !== 'unchanged');

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Pricing Intelligence"
        breadcrumbs={['Pricing Intelligence']}
      />

      {/* Top Banner Alert / Notice */}
      <div className="p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-brand-500/5 to-transparent flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <DollarSign className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-indigo-200">
              Automated Pricing Tracking & Delta Intelligence
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Monitoring official SaaS pricing changes, plan tiers, currencies, and historical revisions across competitors in real time.
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center p-1 bg-dark-950 border border-slate-800 rounded-lg text-xs shrink-0">
          <button
            onClick={() => setActiveTab('deep-dive')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
              activeTab === 'deep-dive'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Competitor Deep Dive
          </button>
          <button
            onClick={() => setActiveTab('comparison-matrix')}
            className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 transition ${
              activeTab === 'comparison-matrix'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Cross-Competitor Matrix
          </button>
        </div>
      </div>

      {activeTab === 'deep-dive' && (
        <div className="space-y-6">
          {/* Controls Bar: Competitors & Billing Cycle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-dark-900 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {competitors.map((comp) => {
                const isSelected = selectedCompetitorId === comp._id;
                return (
                  <button
                    key={comp._id}
                    onClick={() => setSelectedCompetitorId(comp._id)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-2 ${
                      isSelected
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'bg-dark-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {comp.logo && (
                      <img
                        src={comp.logo}
                        alt={comp.name}
                        className="w-3.5 h-3.5 rounded object-contain"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span>{comp.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Billing Cycle Switch */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-slate-400">Billing:</span>
              <div className="flex items-center p-0.5 bg-dark-950 border border-slate-800 rounded-lg text-xs">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    billingCycle === 'monthly' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3 py-1 rounded-md font-medium transition ${
                    billingCycle === 'annual' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Annual (-20%)
                </button>
              </div>
            </div>
          </div>

          {/* If Details Are Fetching */}
          {fetchingDetails ? (
            <LoadingSpinner message={`Loading pricing records for ${selectedCompetitor?.name || 'competitor'}...`} />
          ) : !activeSnapshot || !activeSnapshot.plans || activeSnapshot.plans.length === 0 ? (
            <EmptyState
              title={`No pricing data captured for ${selectedCompetitor?.name || 'this competitor'}`}
              description="The system has not recorded a pricing page snapshot for this competitor yet. No snapshots exist in the database."
            />
          ) : (
            <div className="space-y-6">
              {/* Snapshot Metadata & Historical Delta Banner */}
              <div className="bg-dark-900 border border-slate-800/80 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      {selectedCompetitor?.name} Pricing Structure
                    </h3>
                    <Badge variant="indigo" size="xs">
                      {activeSnapshot.currency || 'USD'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Latest snapshot captured on{' '}
                    <span className="text-slate-200 font-medium">
                      {new Date(activeSnapshot.capturedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>{' '}
                    at{' '}
                    <span className="text-slate-200 font-medium">
                      {new Date(activeSnapshot.capturedAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                </div>

                {/* Price Shift Highlights Callout */}
                {notableChanges && notableChanges.length > 0 ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
                    <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-amber-200">
                      <strong>Recent Shift:</strong>{' '}
                      {notableChanges.map((nc) => `${nc.planName} (${nc.delta.label})`).join(', ')}
                    </span>
                  </div>
                ) : previousSnapshot ? (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-emerald-200">
                      Prices unchanged from previous capture ({new Date(previousSnapshot.capturedAt).toLocaleDateString()})
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-400">
                    <Info className="w-4 h-4 text-slate-400" />
                    <span>Baseline snapshot. No prior historical revisions recorded yet.</span>
                  </div>
                )}
              </div>

              {/* Pricing Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {activeSnapshot.plans.map((plan, idx) => {
                  const displayPrice =
                    plan.price !== null
                      ? billingCycle === 'annual'
                        ? Math.round(plan.price * 0.8)
                        : plan.price
                      : null;

                  const delta = getPlanDelta(plan);

                  const isHighlightedTier =
                    plan.name.toLowerCase().includes('plus') ||
                    plan.name.toLowerCase().includes('business') ||
                    plan.name.toLowerCase().includes('standard') ||
                    plan.name.toLowerCase().includes('starter') ||
                    plan.name.toLowerCase().includes('advanced');

                  return (
                    <div
                      key={idx}
                      className={`bg-dark-900 border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 relative ${
                        isHighlightedTier
                          ? 'border-brand-500/50 shadow-xl shadow-brand-500/5 ring-1 ring-brand-500/20'
                          : 'border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {/* Plan Header */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-base font-bold text-white">{plan.name}</h4>
                          <div className="flex items-center gap-1.5">
                            {plan.isFree && <Badge variant="slate" size="xs">Freemium</Badge>}
                            {plan.isEnterprise && <Badge variant="indigo" size="xs">Enterprise</Badge>}
                          </div>
                        </div>

                        {/* Price & Delta Highlight */}
                        <div className="my-4">
                          {displayPrice !== null ? (
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-white">
                                ${displayPrice}
                              </span>
                              <span className="text-xs text-slate-400">/ user / mo</span>
                            </div>
                          ) : (
                            <div className="text-xl font-bold text-slate-200 py-1">
                              Custom Contact
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[11px] text-slate-500">
                              {billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
                            </span>

                            {/* Meaningful Delta Indicator */}
                            {delta && delta.type === 'increase' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                <TrendingUp className="w-3 h-3" />
                                {delta.label}
                              </span>
                            )}
                            {delta && delta.type === 'decrease' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <TrendingDown className="w-3 h-3" />
                                {delta.label}
                              </span>
                            )}
                            {delta && delta.type === 'new' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                <Zap className="w-3 h-3" />
                                {delta.label}
                              </span>
                            )}
                            {delta && delta.type === 'unchanged' && (
                              <span className="text-[10px] text-slate-500">
                                Stable
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="border-t border-slate-800/80 pt-4 mt-4">
                          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Included Capabilities
                          </p>
                          <ul className="space-y-2 text-xs text-slate-300">
                            {plan.features?.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="leading-snug text-slate-300">{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-6 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                          Verified
                        </span>
                        <span className="capitalize">{plan.billingPeriod || 'Monthly'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Historical Changes Timeline Section */}
              <div className="bg-dark-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-brand-400" />
                    <h4 className="text-sm font-bold text-white">
                      Snapshot History & Pricing Timeline ({historySnapshots.length} Revisions Recorded)
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    Tracked in MongoDB over time
                  </span>
                </div>

                {historySnapshots.length <= 1 ? (
                  <div className="p-4 rounded-lg bg-dark-950 border border-slate-800 text-center text-xs text-slate-400">
                    Only 1 baseline snapshot has been recorded so far for {selectedCompetitor?.name}. Subsequent monitoring crawls will record revision changes here.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-dark-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Capture Date</th>
                          <th className="py-3 px-4">Tiers Recorded</th>
                          <th className="py-3 px-4">Price Range (Monthly)</th>
                          <th className="py-3 px-4">Key Tiers & Values</th>
                          <th className="py-3 px-4 text-right">Status / Shift</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {historySnapshots.map((snap, sIdx) => {
                          const isLatest = sIdx === 0;
                          const numericPlans = snap.plans.filter((p) => p.price !== null);
                          const minPrice = numericPlans.length ? Math.min(...numericPlans.map((p) => p.price)) : 0;
                          const maxPrice = numericPlans.length ? Math.max(...numericPlans.map((p) => p.price)) : 0;

                          // Compare against next oldest snapshot in the array
                          const olderSnap = historySnapshots[sIdx + 1];
                          let shiftDescription = isLatest ? 'Current Active Tier' : 'Previous Snapshot';

                          if (olderSnap) {
                            const changedPlans = snap.plans.filter((p) => {
                              const op = olderSnap.plans.find((x) => x.name.toLowerCase() === p.name.toLowerCase());
                              return op && op.price !== p.price;
                            });
                            if (changedPlans.length > 0) {
                              shiftDescription = `Updated: ${changedPlans.map((cp) => cp.name).join(', ')}`;
                            } else {
                              shiftDescription = 'Identical to prior capture';
                            }
                          }

                          return (
                            <tr
                              key={snap._id || sIdx}
                              className={isLatest ? 'bg-brand-500/5' : 'hover:bg-slate-800/30'}
                            >
                              <td className="py-3 px-4 font-mono font-medium text-slate-200">
                                {new Date(snap.capturedAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                                {isLatest && (
                                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                                    Latest
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4">{snap.plans.length} tiers</td>
                              <td className="py-3 px-4 font-bold text-white">
                                ${minPrice} - ${maxPrice}{' '}
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {snap.currency || 'USD'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-400 max-w-xs truncate">
                                {snap.plans.map((p) => `${p.name}: ${p.price !== null ? `$${p.price}` : 'Custom'}`).join(' | ')}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Badge
                                  variant={isLatest ? 'indigo' : shiftDescription.includes('Updated') ? 'rose' : 'slate'}
                                  size="xs"
                                >
                                  {shiftDescription}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Cross-Competitor Comparison Matrix */}
      {activeTab === 'comparison-matrix' && (
        <div className="space-y-6">
          <div className="bg-dark-900 border border-slate-800/80 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Cross-Competitor Pricing Benchmark</h3>
                <p className="text-xs text-slate-400">
                  Side-by-side breakdown comparing entry, professional, and business plans across competitors.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Billing:</span>
                <div className="flex items-center p-0.5 bg-dark-950 border border-slate-800 rounded-lg text-xs">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 rounded-md font-medium transition ${
                      billingCycle === 'monthly' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annual')}
                    className={`px-3 py-1 rounded-md font-medium transition ${
                      billingCycle === 'annual' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Annual (-20%)
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-dark-950 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Competitor</th>
                    <th className="py-3 px-4">Free / Entry Tier</th>
                    <th className="py-3 px-4">Standard / Pro Tier</th>
                    <th className="py-3 px-4">Business / Advanced</th>
                    <th className="py-3 px-4">Enterprise</th>
                    <th className="py-3 px-4 text-right">Last Verified</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {competitors.map((comp) => {
                    const snap = allLatestSnapshots[comp._id];
                    if (!snap || !snap.plans) {
                      return (
                        <tr key={comp._id} className="hover:bg-slate-800/30">
                          <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                            {comp.logo && (
                              <img
                                src={comp.logo}
                                alt={comp.name}
                                className="w-4 h-4 rounded object-contain"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            )}
                            {comp.name}
                          </td>
                          <td colSpan={5} className="py-3.5 px-4 text-slate-500 italic">
                            No pricing snapshots captured yet for this competitor.
                          </td>
                        </tr>
                      );
                    }

                    // Extract common tiers
                    const freePlan = snap.plans.find((p) => p.isFree || p.price === 0);
                    const proPlan = snap.plans.find(
                      (p) =>
                        p.name.toLowerCase().includes('plus') ||
                        p.name.toLowerCase().includes('standard') ||
                        p.name.toLowerCase().includes('unlimited') ||
                        p.name.toLowerCase().includes('starter')
                    );
                    const bizPlan = snap.plans.find(
                      (p) =>
                        p.name.toLowerCase().includes('business') ||
                        p.name.toLowerCase().includes('advanced')
                    );
                    const entPlan = snap.plans.find((p) => p.isEnterprise || p.price === null);

                    const formatPrice = (p) => {
                      if (!p) return <span className="text-slate-500">—</span>;
                      if (p.price === 0 || p.isFree) {
                        return <span className="font-semibold text-emerald-400">Free ($0)</span>;
                      }
                      if (p.price === null) {
                        return <span className="font-semibold text-indigo-300">Custom</span>;
                      }
                      const val = billingCycle === 'annual' ? Math.round(p.price * 0.8) : p.price;
                      return (
                        <div className="font-mono">
                          <span className="text-white font-bold text-sm">${val}</span>
                          <span className="text-[10px] text-slate-400">/mo</span>
                          <div className="text-[10px] text-slate-500">{p.name}</div>
                        </div>
                      );
                    };

                    return (
                      <tr key={comp._id} className="hover:bg-slate-800/30">
                        <td className="py-3.5 px-4 font-bold text-white flex items-center gap-2">
                          {comp.logo && (
                            <img
                              src={comp.logo}
                              alt={comp.name}
                              className="w-4 h-4 rounded object-contain"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          )}
                          {comp.name}
                        </td>
                        <td className="py-3.5 px-4">{formatPrice(freePlan)}</td>
                        <td className="py-3.5 px-4">{formatPrice(proPlan)}</td>
                        <td className="py-3.5 px-4">{formatPrice(bizPlan)}</td>
                        <td className="py-3.5 px-4">{formatPrice(entPlan)}</td>
                        <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-400">
                          {new Date(snap.capturedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

