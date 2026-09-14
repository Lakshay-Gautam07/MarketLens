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
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';

export default function Pricing() {
  const { setSidebarOpen } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [selectedCompetitorId, setSelectedCompetitorId] = useState(null);
  const [activeSnapshot, setActiveSnapshot] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly'); // 'monthly' | 'annual'

  // 1. Fetch competitors
  useEffect(() => {
    const loadCompetitors = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.competitors.getAll();
        const comps = res.data || [];
        setCompetitors(comps);
        if (comps.length > 0) {
          setSelectedCompetitorId(comps[0]._id);
        }
      } catch (err) {
        console.error('Failed to load competitors for pricing:', err);
        setError(err.message || 'Failed to connect to backend pricing service');
      } finally {
        setLoading(false);
      }
    };
    loadCompetitors();
  }, []);

  // 2. Fetch pricing snapshot for selected competitor
  useEffect(() => {
    if (!selectedCompetitorId) return;

    const loadPricing = async () => {
      try {
        const res = await api.pricing.getByCompetitorId(selectedCompetitorId);
        setActiveSnapshot(res.data?.latest || null);
      } catch (err) {
        console.error('Failed to fetch pricing for competitor:', err);
        setActiveSnapshot(null);
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
        <LoadingSpinner message="Fetching pricing snapshots from MongoDB..." />
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

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Pricing Intelligence"
        breadcrumbs={['Pricing Intelligence']}
      />

      {/* Pricing Change Callout */}
      <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <h4 className="font-bold text-amber-200">
            Live Pricing Intelligence Sync Active
          </h4>
          <p className="text-slate-300">
            Comparing verified pricing tiers stored in MongoDB across monitored competitor domains.
          </p>
        </div>
      </div>

      {/* Competitor Selector & Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-dark-900 border border-slate-800/80 p-4 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto">
          {competitors.map((comp) => (
            <button
              key={comp._id}
              onClick={() => setSelectedCompetitorId(comp._id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                selectedCompetitorId === comp._id
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-dark-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {comp.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Billing:</span>
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
      </div>

      {/* Pricing Cards Grid */}
      {!activeSnapshot || !activeSnapshot.plans || activeSnapshot.plans.length === 0 ? (
        <EmptyState
          title={`No pricing plans captured for ${selectedCompetitor?.name || 'this competitor'}`}
          description="The monitoring system has not recorded a pricing page snapshot for this competitor yet."
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Captured on: {new Date(activeSnapshot.capturedAt).toLocaleDateString()} at{' '}
              {new Date(activeSnapshot.capturedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="font-mono">Currency: {activeSnapshot.currency || 'USD'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {activeSnapshot.plans.map((plan, idx) => {
              const displayPrice =
                plan.price !== null
                  ? billingCycle === 'annual'
                    ? Math.round(plan.price * 0.8)
                    : plan.price
                  : null;

              return (
                <div
                  key={idx}
                  className={`bg-dark-900 border rounded-xl p-6 flex flex-col justify-between transition-all duration-200 ${
                    plan.name.toLowerCase().includes('plus') ||
                    plan.name.toLowerCase().includes('business') ||
                    plan.name.toLowerCase().includes('advanced')
                      ? 'border-brand-500/50 shadow-xl shadow-brand-500/5'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-base font-bold text-white">{plan.name}</h4>
                      {plan.isFree && <Badge variant="slate" size="xs">Freemium</Badge>}
                      {plan.isEnterprise && <Badge variant="indigo" size="xs">Enterprise</Badge>}
                    </div>

                    <div className="my-4">
                      {displayPrice !== null ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-3xl font-black text-white">${displayPrice}</span>
                          <span className="text-xs text-slate-400">/ user / mo</span>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-slate-200">Custom Contact</span>
                      )}
                      <p className="text-[11px] text-slate-500 mt-1">
                        {billingCycle === 'annual' ? 'Billed annually' : 'Billed monthly'}
                      </p>
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 mt-4">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        Included Capabilities
                      </p>
                      <ul className="space-y-2.5 text-xs text-slate-300">
                        {plan.features?.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="leading-snug">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60">
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Verified from public pricing page
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
