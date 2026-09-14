import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Header from '../components/layout/Header';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import {
  Settings as SettingsIcon,
  ShieldCheck,
  Cpu,
  Clock,
  Bell,
  Save,
  Check,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { mockSources } from '../data/mockData';

export default function Settings() {
  const { setSidebarOpen } = useOutletContext();
  const [saved, setSaved] = useState(false);
  const [cronExp, setCronExp] = useState('0 */6 * * *');
  const [geminiModel, setGeminiModel] = useState('gemini-3.6-flash');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [slackAlerts, setSlackAlerts] = useState(true);
  const [alertThreshold, setAlertThreshold] = useState('high');

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <Header
        onMenuClick={() => setSidebarOpen(true)}
        title="System Settings"
        breadcrumbs={['Settings']}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Crawler & AI Config */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Crawler & Monitoring Engine"
            subtitle="Configure automated background scraping schedules and tolerances"
          >
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Crawl Schedule (Cron Expression)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={cronExp}
                    onChange={(e) => setCronExp(e.target.value)}
                    className="flex-1 bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                  <Badge variant="emerald">Every 6 Hours</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Controlled by environment variable <code className="text-slate-400">MONITOR_CRON</code>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    HTTP Timeout (seconds)
                  </label>
                  <input
                    type="number"
                    defaultValue={15}
                    className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Concurrent Requests Cap
                  </label>
                  <input
                    type="number"
                    defaultValue={3}
                    className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Public User-Agent String
                </label>
                <input
                  type="text"
                  readOnly
                  value="MarketLensBot/1.0 (competitive-intelligence-monitor; contact via your-domain.com)"
                  className="w-full bg-dark-950/60 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-mono text-[11px] cursor-not-allowed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-semibold transition shadow"
                >
                  {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                  <span>{saved ? 'Preferences Saved' : 'Save Configurations'}</span>
                </button>
              </div>
            </form>
          </Card>

          {/* AI Intelligence Provider */}
          <Card
            title="Gemini AI Analysis Engine"
            subtitle="Parameters for automated change impact synthesis and counter-strategy generation"
          >
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Active Model Architecture
                </label>
                <select
                  value={geminiModel}
                  onChange={(e) => setGeminiModel(e.target.value)}
                  className="w-full bg-dark-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-brand-500"
                >
                  <option value="gemini-3.6-flash">Google Gemini 3.6 Flash (Recommended — Low Latency & High Reasoning)</option>
                  <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (Latest Preview)</option>
                  <option value="gemini-2.5-flash">Google Gemini 2.5 Flash (Legacy)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-lg bg-dark-950 border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300">API Connection Status</span>
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Connected
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Secured through backend environment variable <code className="text-slate-400">GEMINI_API_KEY</code>. Never exposed to browser clients.
                </p>
              </div>
            </div>
          </Card>

          {/* Notification Alerts */}
          <Card
            title="Strategic Alert Dispatch"
            subtitle="Deliver instant notifications when high-significance moves are detected"
          >
            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between p-3 rounded-lg bg-dark-950 border border-slate-800 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-200">Email Intelligence Digest</p>
                  <p className="text-[11px] text-slate-500">Send weekly intelligence report and critical alerts</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-lg bg-dark-950 border border-slate-800 cursor-pointer">
                <div>
                  <p className="font-semibold text-slate-200">Slack Webhook Broadcast</p>
                  <p className="text-[11px] text-slate-500">Post immediate alerts to #competitive-intel channel</p>
                </div>
                <input
                  type="checkbox"
                  checked={slackAlerts}
                  onChange={(e) => setSlackAlerts(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                />
              </label>
            </div>
          </Card>
        </div>

        {/* Right 1 Col: Monitored Source Inventory */}
        <div className="space-y-6">
          <Card
            title="Monitored Sources (14)"
            subtitle="Verified live crawl targets"
          >
            <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
              {mockSources.map((src) => (
                <div
                  key={src._id}
                  className="p-2.5 rounded-lg border border-slate-800/80 bg-dark-950/60 flex items-center justify-between text-xs"
                >
                  <div className="truncate mr-2">
                    <p className="font-semibold text-slate-200 truncate">{src.name}</p>
                    <p className="text-[10px] text-slate-500 truncate">{src.url}</p>
                  </div>
                  <Badge variant={src.type} size="xs">{src.type}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
