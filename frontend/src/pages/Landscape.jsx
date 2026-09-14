import React, { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import {
  ExternalLink,
  Plus,
  Search,
  Filter,
  Layers,
  ArrowUpRight,
  Shield,
  Activity,
  Globe,
} from 'lucide-react';
import { mockCompetitors } from '../data/mockData';

export default function Landscape() {
  const navigate = useNavigate();
  const { setSidebarOpen } = useOutletContext();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Productivity & Workspace', 'Project & Issue Tracking', 'Work Management', 'Enterprise Collaboration'];

  const filteredCompetitors = mockCompetitors.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Competitive Landscape"
        breadcrumbs={['Landscape']}
      />

      {/* Action and Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tracked competitors..."
            className="w-full bg-dark-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-dark-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Competitors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredCompetitors.map((comp) => (
          <div
            key={comp._id}
            onClick={() => navigate(`/landscape/${comp._id}`)}
            className="bg-dark-900 border border-slate-800/80 hover:border-slate-700 hover:shadow-xl hover:shadow-black/50 rounded-xl p-5 cursor-pointer transition-all duration-200 flex flex-col justify-between group"
          >
            <div>
              {/* Card top */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img
                    src={comp.logo}
                    alt={comp.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                    className="w-10 h-10 rounded-lg bg-slate-800 p-1 border border-slate-700 object-contain group-hover:border-brand-500/50 transition"
                  />
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition flex items-center gap-2">
                      {comp.name}
                      <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition" />
                    </h3>
                    <p className="text-xs text-slate-400">{comp.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <Badge variant={comp.threatLevel === 'High' ? 'critical' : 'medium'}>
                    {comp.threatLevel} Threat
                  </Badge>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active crawler monitoring" />
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-4">
                {comp.description}
              </p>
            </div>

            {/* Metrics footer */}
            <div className="pt-4 border-t border-slate-800/60 grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-dark-950/50 border border-slate-800/50">
                <span className="text-xs font-bold text-white">{comp.trackedSourcesCount}</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Sources</p>
              </div>
              <div className="p-2 rounded-lg bg-dark-950/50 border border-slate-800/50">
                <span className="text-xs font-bold text-brand-400">{comp.changeCount30d}</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">30d Diffs</p>
              </div>
              <div className="p-2 rounded-lg bg-dark-950/50 border border-slate-800/50">
                <span className="text-xs font-bold text-slate-200">{comp.marketShare}</span>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">Est. Share</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
