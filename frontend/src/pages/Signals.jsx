import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import {
  Sparkles,
  ShieldCheck,
  Zap,
  Target,
  Users,
  Compass,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { mockInsights } from '../data/mockData';

export default function Signals() {
  const { setSidebarOpen } = useOutletContext();
  const [selectedCompetitor, setSelectedCompetitor] = useState('All');

  const filteredInsights = mockInsights.filter((ins) => {
    return selectedCompetitor === 'All' || ins.competitorName === selectedCompetitor;
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
          <Badge variant="indigo" size="xs">Model: Gemini 3.6 Flash</Badge>
        </div>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          MarketLens synthesizes crawling diffs into executive-level competitive insights. Each signal evaluates strategic impact, competitive advantages gained by rivals, and specific counter-positioning actions for your product and marketing teams.
        </p>
      </div>

      {/* Filter bar */}
      <div className="flex items-center justify-between bg-dark-900 border border-slate-800 p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Competitor:</span>
          {['All', 'Notion', 'Linear', 'ClickUp'].map((name) => (
            <button
              key={name}
              onClick={() => setSelectedCompetitor(name)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                selectedCompetitor === name
                  ? 'bg-brand-600 text-white'
                  : 'bg-dark-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{filteredInsights.length}</span> strategic signals
        </span>
      </div>

      {/* Strategic Insights Cards */}
      <div className="space-y-6">
        {filteredInsights.map((ins) => (
          <div
            key={ins._id}
            className="bg-dark-900 border border-slate-800/90 hover:border-slate-700/80 rounded-xl p-6 transition-all duration-200 space-y-5"
          >
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white">{ins.competitorName}</span>
                  <Badge variant={ins.category}>{ins.category}</Badge>
                </div>
                <h3 className="text-base font-bold text-slate-100">{ins.changeTitle}</h3>
              </div>

              {/* Confidence Score */}
              <div className="flex items-center gap-3 bg-dark-950 px-3.5 py-1.5 rounded-lg border border-slate-800">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Confidence</p>
                  <p className="text-xs font-black text-amber-400">
                    {(ins.confidence * 100).toFixed(0)}%
                  </p>
                </div>
                <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${ins.confidence * 100}%` }}
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
                  {ins.strategicImpact}
                </p>
              </div>

              {/* Competitor Advantage */}
              <div className="p-4 rounded-xl bg-dark-950 border border-rose-500/20 space-y-2">
                <div className="flex items-center gap-2 text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <Zap className="w-4 h-4" />
                  <span>Competitor Advantage</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {ins.competitorAdvantage}
                </p>
              </div>

              {/* Recommended Action */}
              <div className="p-4 rounded-xl bg-dark-950 border border-emerald-500/20 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Target className="w-4 h-4" />
                  <span>Recommended Action</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {ins.recommendedAction}
                </p>
              </div>
            </div>

            {/* Footer meta: Affected Segment & Date */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>Affected Target Segments:</span>
                <span className="text-slate-200 font-semibold">{ins.affectedSegment}</span>
              </div>
              <span>Analyzed on {new Date(ins.createdAt).toLocaleString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
