import React, { useState } from 'react';
import { AlertCircle, Terminal, Activity, FileText, Send, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';

export default function App() {
  const [alert, setAlert] = useState('');
  const [logs, setLogs] = useState('');
  const [runbook, setRunbook] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert, logs, runbook }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to analyze incident');
      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return 'bg-red-500/20 text-red-500 border-red-500/50';
      case 'high': return 'bg-orange-500/20 text-orange-500 border-orange-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-500 border-yellow-500/50';
      case 'low': return 'bg-green-500/20 text-green-500 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-500 border-gray-500/50';
    }
  };

  const getSeverityIcon = (sev) => {
    switch (sev?.toLowerCase()) {
      case 'critical': return <ShieldAlert size={16} className="mr-2 inline" />;
      case 'high': return <AlertTriangle size={16} className="mr-2 inline" />;
      case 'medium': return <AlertCircle size={16} className="mr-2 inline" />;
      default: return <CheckCircle2 size={16} className="mr-2 inline" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0D14] text-gray-200 p-6 md:p-10 font-sans selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center space-x-3 mb-10 pb-6 border-b border-gray-800/60">
          <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
            <Activity className="text-blue-500" size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Incident Triage AI</h1>
            <p className="text-gray-400 text-sm mt-1">Automated DevSecOps incident analysis & runbook generation</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="col-span-1 lg:col-span-5 space-y-6">
            <div className="glass-card p-6 rounded-2xl border border-gray-800/50 relative overflow-hidden group hover:border-gray-700 transition-colors">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

              <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300">
                    <AlertCircle size={16} className="mr-2 text-rose-400" /> Webhook Alert Message
                  </label>
                  <input
                    type="text"
                    required
                    value={alert}
                    onChange={(e) => setAlert(e.target.value)}
                    placeholder="e.g. HIGH CPU USAGE on production-db-writer"
                    className="w-full bg-[#131722] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 placeholder-gray-600 transition-all font-mono text-sm shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300">
                    <Terminal size={16} className="mr-2 text-indigo-400" /> Recent Logs
                  </label>
                  <textarea
                    rows={6}
                    value={logs}
                    onChange={(e) => setLogs(e.target.value)}
                    placeholder="Paste application or system logs here..."
                    className="w-full bg-[#131722] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 placeholder-gray-600 transition-all font-mono text-sm shadow-inner resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-300">
                    <FileText size={16} className="mr-2 text-emerald-400" /> Optional Runbook / Context
                  </label>
                  <textarea
                    rows={3}
                    value={runbook}
                    onChange={(e) => setRunbook(e.target.value)}
                    placeholder="Provide any known context..."
                    className="w-full bg-[#131722] border border-gray-800 text-gray-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 placeholder-gray-600 transition-all font-mono text-sm shadow-inner resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !alert}
                  className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] border border-white/5 active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="flex items-center">
                      Processing...
                    </span>
                  ) : (
                    <>
                      <span>Analyze Incident</span>
                      <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-7">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl flex items-start animate-fade-in mb-6">
                <AlertTriangle className="mr-3 mt-0.5 shrink-0" size={20} />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-6 animate-fade-in-up pb-10">
                <div className="glass-card p-6 rounded-2xl border border-gray-800 bg-[#0E121A]/80 shadow-xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-medium text-white mb-2">Diagnostic Summary</h2>
                      <p className="text-gray-300 text-sm leading-relaxed">{result.analysis.summary}</p>
                    </div>
                    
                    <div className={`px-4 py-1.5 rounded-full border text-sm font-semibold whitespace-nowrap flex items-center shadow-lg ${getSeverityColor(result.analysis.severity)}`}>
                      {getSeverityIcon(result.analysis.severity)}
                      {result.analysis.severity?.toUpperCase()} SEVERITY
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-[#131722] p-4 rounded-xl border border-gray-800/80">
                      <p className="text-xs text-gray-500 font-medium tracking-wider uppercase mb-1">Affected Service</p>
                      <p className="text-gray-100 font-medium font-mono text-sm">{result.analysis.affected_service}</p>
                    </div>
                    <div className="bg-[#131722] p-4 rounded-xl border border-gray-800/80">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">Confidence</p>
                        <span className="text-xs text-blue-400 font-bold">{result.analysis.confidence}</span>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-1.5 mt-2 overflow-hidden">
                        <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: result.analysis.confidence }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 rounded-2xl border border-rose-900/30 bg-gradient-to-b from-rose-950/10 to-transparent">
                  <h3 className="text-lg font-medium text-rose-300 mb-3 flex items-center">
                    <Activity className="mr-2" size={18} /> Root Cause Analysis
                  </h3>
                  <p className="text-gray-200 text-sm leading-relaxed font-medium">
                    {result.analysis.root_cause}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-card p-6 rounded-2xl border border-gray-800 bg-[#0E121A]">
                    <h3 className="text-lg font-medium text-emerald-400 mb-4 flex items-center">
                      <CheckCircle2 className="mr-2" size={18} /> Priority Mitigation
                    </h3>
                    <ol className="space-y-4">
                      {result.analysis.priority_order?.map((step, i) => (
                        <li key={i} className="flex flex-col gap-1">
                          <div className="flex items-start text-sm text-gray-200">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold mr-3 shrink-0 border border-emerald-500/20">
                              {i + 1}
                            </span>
                            <span className="pt-0.5">{step}</span>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="glass-card p-6 rounded-2xl border border-gray-800 bg-[#0E121A]">
                     <h3 className="text-lg font-medium text-indigo-400 mb-4 flex items-center">
                      <FileText className="mr-2" size={18} /> Investigation Steps
                    </h3>
                    <ul className="space-y-3">
                      {result.analysis.recommended_actions?.map((action, i) => (
                        <li key={i} className="flex items-start text-sm text-gray-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 mr-3 shrink-0"></div>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden bg-[#131722]">
                  <div className="bg-gray-800/40 px-4 py-3 border-b border-gray-700/50 flex items-center">
                    <span className="text-sm font-medium text-gray-200">#incident-alerts (Slack Ready)</span>
                  </div>
                  <div className="p-4 sm:p-6 font-mono text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {result.slackMessage}
                  </div>
                </div>
                
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
