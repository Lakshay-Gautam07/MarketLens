import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ErrorState, EmptyState } from '../components/common/EmptyState';
import {
  FileText,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Target,
  Copy,
  Check,
} from 'lucide-react';
import { api } from '../services/api';

export default function Reports() {
  const { setSidebarOpen } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.reports.getAll();
      const loaded = res.data || [];
      setReports(loaded);
      if (loaded.length > 0) {
        setSelectedReportId(loaded[0]._id);
      }
    } catch (err) {
      console.error('Failed to load weekly reports:', err);
      setError(err.message || 'Failed to fetch reports from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const activeReport =
    reports.find((r) => r._id === selectedReportId) || reports[0];

  const handleCopy = () => {
    if (!activeReport) return;
    const text = `
# Weekly Intelligence Digest
Week: ${new Date(activeReport.weekStart).toLocaleDateString()} - ${new Date(activeReport.weekEnd).toLocaleDateString()}

## Key Competitor Movements
${(activeReport.keyChanges || []).map((c) => `- ${c}`).join('\n')}

## Strategic Signals & Inferred Vectors
${(activeReport.strategicSignals || []).map((s) => `- ${s}`).join('\n')}

## Recommended Counter-Actions
${(activeReport.recommendations || []).map((r) => `- ${r}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Weekly Intelligence Reports"
        breadcrumbs={['Weekly Reports']}
      />

      {loading ? (
        <LoadingSpinner message="Fetching intelligence reports from MongoDB..." />
      ) : error ? (
        <ErrorState
          title="Could not load reports"
          message={error}
          onRetry={fetchReports}
        />
      ) : reports.length === 0 ? (
        <EmptyState
          title="No reports generated yet"
          description="The weekly intelligence synthesizer hasn't compiled a report in the database yet."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Report Archive List */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
              Report Archive ({reports.length})
            </h3>
            <div className="space-y-2">
              {reports.map((report) => (
                <button
                  key={report._id}
                  onClick={() => setSelectedReportId(report._id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedReportId === report._id
                      ? 'bg-brand-600/15 border-brand-500/40 text-white shadow-md'
                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-400 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {new Date(report.weekStart).toLocaleDateString()} —{' '}
                      {new Date(report.weekEnd).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-100 line-clamp-1">
                    {report.keyChanges?.[0] || 'Weekly Intelligence Digest'}
                  </h4>
                </button>
              ))}
            </div>
          </div>

          {/* Right Main Content: Active Weekly Report */}
          {activeReport && (
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-dark-900 border border-slate-800 rounded-xl p-6 space-y-6">
                {/* Header with Title & Action buttons */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider bg-brand-500/10 px-2.5 py-0.5 rounded border border-brand-500/30">
                        Synthesized Intelligence Digest
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(activeReport.weekStart).toLocaleDateString()} -{' '}
                        {new Date(activeReport.weekEnd).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Weekly Competitive Intelligence Brief
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-950 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-200 transition"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copied ? 'Copied to Clipboard' : 'Copy Brief'}</span>
                    </button>
                  </div>
                </div>

                {/* Key Changes Across Competitors */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    Key Competitor Movements
                  </h4>
                  <div className="space-y-2">
                    {(activeReport.keyChanges || []).map((change, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-dark-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0 mt-1.5" />
                        <span>{change}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Signals */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    Identified Strategic Signals & Industry Vectors
                  </h4>
                  <div className="space-y-2">
                    {(activeReport.strategicSignals || []).map((signal, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-dark-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-200 leading-relaxed"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                        <span>{signal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Recommendations */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-emerald-400" />
                    Recommended Strategic Actions
                  </h4>
                  <div className="space-y-2">
                    {(activeReport.recommendations || []).map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-dark-950/60 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-100 leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
