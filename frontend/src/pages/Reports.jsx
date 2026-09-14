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
  Sparkles,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  Layers,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { api } from '../services/api';

export default function Reports() {
  const { setSidebarOpen } = useOutletContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [selectedReportId, setSelectedReportId] = useState(null);
  const [copied, setCopied] = useState(false);

  // Generation Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);

  // Default to the current week
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const lastMonday = new Date(today);
  lastMonday.setDate(today.getDate() - distanceToMonday);
  const nextSunday = new Date(lastMonday);
  nextSunday.setDate(lastMonday.getDate() + 6);

  const [formWeekStart, setFormWeekStart] = useState(
    lastMonday.toISOString().slice(0, 10)
  );
  const [formWeekEnd, setFormWeekEnd] = useState(
    nextSunday.toISOString().slice(0, 10)
  );

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

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    if (!formWeekStart) return;

    setGenerating(true);
    setGenerationError(null);

    try {
      const payload = {
        weekStart: new Date(formWeekStart).toISOString(),
        weekEnd: formWeekEnd ? new Date(`${formWeekEnd}T23:59:59.999Z`).toISOString() : undefined,
      };

      const res = await api.reports.generate(payload);
      const newReport = res.data;

      // Update local report list: replace if existing weekStart, or prepend
      setReports((prev) => {
        const existingIndex = prev.findIndex(
          (r) => new Date(r.weekStart).toISOString().slice(0, 10) === formWeekStart
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = newReport;
          return updated;
        } else {
          return [newReport, ...prev];
        }
      });

      setSelectedReportId(newReport._id);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to generate report:', err);
      setGenerationError(err.message || 'Gemini report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="Weekly Intelligence Reports"
        breadcrumbs={['Weekly Reports']}
      />

      {/* Top Banner & Generation Trigger */}
      <div className="p-4 rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/10 via-brand-500/5 to-transparent flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-bold text-indigo-200">
              Automated Gemini Intelligence Synthesis
            </h4>
            <p className="text-slate-300 leading-relaxed">
              Consolidates multi-competitor movements, pricing shifts, and strategic signals into an executive brief.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setGenerationError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-lg shadow-brand-600/20 transition whitespace-nowrap shrink-0"
        >
          <Sparkles className="w-4 h-4" />
          <span>Generate New Report</span>
        </button>
      </div>

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
          description="The weekly intelligence synthesizer hasn't compiled a report in the database yet. Click 'Generate New Report' to synthesize your first brief."
          actionText="Generate Report"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar: Report Archive List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Report Archive ({reports.length})
              </h3>
              <button
                onClick={fetchReports}
                title="Refresh reports"
                className="text-slate-400 hover:text-white transition p-1"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2">
              {reports.map((report) => {
                const isSelected = selectedReportId === report._id;
                const startDateStr = new Date(report.weekStart).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
                const endDateStr = new Date(report.weekEnd).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <button
                    key={report._id}
                    onClick={() => setSelectedReportId(report._id)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-brand-600/15 border-brand-500/40 text-white shadow-md'
                        : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-brand-400 mb-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {startDateStr} — {endDateStr}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 line-clamp-2 leading-snug">
                      {report.keyChanges?.[0] || 'Weekly Intelligence Digest'}
                    </h4>
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{report.keyChanges?.length || 0} changes</span>
                      <span>•</span>
                      <span>{report.recommendations?.length || 0} actions</span>
                    </div>
                  </button>
                );
              })}
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
                      <span className="text-[11px] font-bold text-brand-400 uppercase tracking-wider bg-brand-500/10 px-2.5 py-0.5 rounded border border-brand-500/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-brand-400" />
                        Synthesized Executive Brief
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        {new Date(activeReport.weekStart).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}{' '}
                        -{' '}
                        {new Date(activeReport.weekEnd).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Weekly Competitive Intelligence Brief
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-dark-950 border border-slate-700 hover:border-slate-500 text-xs font-semibold text-slate-200 transition shadow-sm"
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
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-400" />
                      Key Competitor Movements
                    </h4>
                    <Badge variant="indigo" size="xs">
                      {activeReport.keyChanges?.length || 0} Movements
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {(activeReport.keyChanges || []).map((change, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-dark-950/70 border border-slate-800/90 flex items-start gap-3 text-xs text-slate-200 leading-relaxed hover:border-slate-700 transition"
                      >
                        <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0 mt-1.5" />
                        <span className="font-normal text-slate-200">{change}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strategic Signals */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      Identified Strategic Signals & Market Vectors
                    </h4>
                    <Badge variant="high" size="xs">
                      {activeReport.strategicSignals?.length || 0} Inferred Vectors
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {(activeReport.strategicSignals || []).map((signal, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-dark-950/70 border border-amber-500/20 bg-amber-500/5 flex items-start gap-3 text-xs text-slate-200 leading-relaxed"
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                        <span className="font-normal text-slate-200">{signal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actionable Recommendations */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-emerald-400" />
                      Recommended Strategic Counter-Actions
                    </h4>
                    <Badge variant="actioned" size="xs">
                      {activeReport.recommendations?.length || 0} Action Items
                    </Badge>
                  </div>
                  <div className="space-y-2.5">
                    {(activeReport.recommendations || []).map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-lg bg-dark-950/70 border border-emerald-500/20 bg-emerald-500/5 flex items-start gap-3 text-xs text-slate-100 leading-relaxed"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="font-medium text-slate-100">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    Synthesized from verified Change & AIInsight documents
                  </span>
                  <span>Collection: weekly_reports</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-dark-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400 border border-brand-500/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Generate Weekly Report</h3>
                  <p className="text-[11px] text-slate-400">Synthesize competitive changes with Gemini AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition text-sm font-bold p-1"
                disabled={generating}
              >
                ✕
              </button>
            </div>

            {generationError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-semibold">Generation Failed</div>
                  <div>{generationError}</div>
                </div>
              </div>
            )}

            <form onSubmit={handleGenerateReport} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Week Start Date</label>
                <input
                  type="date"
                  value={formWeekStart}
                  onChange={(e) => setFormWeekStart(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                  disabled={generating}
                />
                <p className="text-[11px] text-slate-500">
                  Select the beginning of the weekly window (e.g. Monday).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-semibold block">Week End Date</label>
                <input
                  type="date"
                  value={formWeekEnd}
                  onChange={(e) => setFormWeekEnd(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                  required
                  disabled={generating}
                />
                <p className="text-[11px] text-slate-500">
                  Select the end of the analysis period (e.g. Sunday).
                </p>
              </div>

              <div className="p-3 rounded-lg bg-dark-950 border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300">How synthesis works:</span>
                <p>
                  MarketLens retrieves all changes recorded in MongoDB during this interval, passes them alongside their AI insights to Gemini, and generates an executive brief.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-dark-950 border border-slate-800 text-slate-300 hover:text-white font-medium transition"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-bold flex items-center gap-2 transition disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing with Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Brief</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

