import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2, Server, Clock, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

export default function App() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  // Poll backend every 3 seconds
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/alerts');
        const data = await response.json();
        if (data.success) {
          setAlerts(data.data);
        }
      } catch (err) {
        console.error('Failed to fetch alerts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    try {
      await fetch(`http://localhost:3000/api/alerts/${id}/resolve`, { method: 'POST' });
      // update locally to feel snappy
      setAlerts(alerts.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
    } catch (err) {
      console.error(err);
    }
  };

  const getSeverityStyle = (sev) => {
    switch (sev?.toUpperCase()) {
      case 'SEV-1': return { bg: 'bg-red-500/20', text: 'text-red-500', border: 'border-red-500/50', icon: <ShieldAlert size={16} className="mr-2 inline" /> };
      case 'SEV-2': return { bg: 'bg-orange-500/20', text: 'text-orange-500', border: 'border-orange-500/50', icon: <AlertTriangle size={16} className="mr-2 inline" /> };
      case 'SEV-3': return { bg: 'bg-yellow-500/20', text: 'text-yellow-500', border: 'border-yellow-500/50', icon: <AlertCircle size={16} className="mr-2 inline" /> };
      default: return { bg: 'bg-blue-500/20', text: 'text-blue-500', border: 'border-blue-500/50', icon: <AlertCircle size={16} className="mr-2 inline" /> };
    }
  };

  const activeAlerts = alerts.filter(a => a.status !== 'resolved');
  const criticalCount = activeAlerts.filter(a => a.ai_severity?.toUpperCase() === 'SEV-1').length;
  // Assume 5 min saved per alert handled by AI
  const timeSavedMins = alerts.filter(a => a.status === 'analyzed' || a.status === 'resolved').length * 5;

  return (
    <div className="min-h-screen bg-[#0A0D14] text-gray-200 p-6 md:p-10 font-sans selection:bg-blue-500/30">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-800/60">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
              <Activity className="text-blue-500" size={28} />
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-1">TriageOps Dashboard</h1>
              <div className="flex items-center space-x-2 text-sm">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-400 font-medium">Listening for Live Alerts</span>
              </div>
            </div>
          </div>
        </header>

        {/* Metrics Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#131722] border border-gray-800 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-400 font-medium text-sm">Active Incidents</p>
              <Server className="text-blue-500 opacity-50" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-white">{activeAlerts.length}</h3>
          </div>
          <div className="bg-[#131722] border border-gray-800 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-400 font-medium text-sm">SEV-1 Incidents</p>
              <ShieldAlert className="text-red-500 opacity-50" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-red-500">{criticalCount}</h3>
          </div>
          <div className="bg-[#131722] border border-gray-800 rounded-2xl p-5 shadow-lg">
            <div className="flex justify-between items-start mb-2">
              <p className="text-gray-400 font-medium text-sm">Manual Time Saved</p>
              <Clock className="text-emerald-500 opacity-50" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-white max-w-full truncate">{timeSavedMins} <span className="text-lg text-gray-500 font-medium">mins</span></h3>
          </div>
          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border border-blue-500/20 rounded-2xl p-5 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
            <div className="flex justify-between items-start mb-2">
              <p className="text-blue-300 font-medium text-sm">AI Accuracy (Mock)</p>
              <ShieldCheck className="text-blue-400 opacity-80" size={20} />
            </div>
            <h3 className="text-3xl font-bold text-white">94<span className="text-lg text-blue-400/80 font-medium">%</span></h3>
          </div>
        </div>

        {/* Alert Feed */}
        <div className="space-y-4">
          <h2 className="text-xl font-medium text-gray-200 flex items-center mb-6">
            Incident Queue
            <span className="ml-3 bg-gray-800 text-gray-300 text-xs py-0.5 px-2.5 rounded-full font-mono">{activeAlerts.length}</span>
          </h2>

          {loading ? (
            <div className="text-center py-20 text-gray-500 animate-pulse font-medium">Initializing AI Triage Queue...</div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-gray-800 rounded-2xl bg-[#131722]/50">
              <CheckCircle2 size={48} className="mx-auto text-emerald-500/50 mb-4" />
              <p className="text-gray-400">No telemetry detected. All systems operational.</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const style = getSeverityStyle(alert.ai_severity);
              const isExpanded = expandedId === alert.id;

              if (alert.status === 'resolved') return null;

              return (
                <div
                  key={alert.id}
                  className={`bg-[#0E121A] border border-gray-800 rounded-xl shadow-lg transition-all duration-300 overflow-hidden hover:border-gray-700 w-full animate-in fade-in slide-in-from-bottom-4 relative group`}
                >
                  <div className={`absolute top-0 left-0 w-1 h-full ${style.bg.replace('/20', '')}`}></div>

                  <div
                    className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
                    onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                  >
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        {alert.status === 'pending' ? (
                          <span className="text-xs tracking-wide bg-blue-500/20 text-blue-400 py-1 px-2 rounded font-medium border border-blue-500/20 animate-pulse">
                            AI PROCESSING
                          </span>
                        ) : (
                          <span className={`text-xs font-bold tracking-wide uppercase px-2.5 py-1 rounded border ${style.bg} ${style.text} ${style.border} flex items-center`}>
                            {style.icon} {alert.ai_severity}
                          </span>
                        )}
                        <span className="text-xs font-mono text-gray-500 border border-gray-800 px-2 py-1 rounded">
                          {alert.source}
                        </span>
                        <span className="text-xs text-gray-600">
                          {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-200 font-medium truncate">{alert.raw_message}</p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      {alert.ai_category && (
                        <span className="hidden md:flex text-sm text-gray-400 bg-gray-900 px-3 py-1.5 rounded-lg border border-gray-800">
                          {alert.ai_category}
                        </span>
                      )}
                      <button
                        className="text-gray-500 group-hover:text-gray-300 transition-colors p-2"
                      >
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && alert.status === 'analyzed' && (
                    <div className="bg-[#131722] border-t border-gray-800 p-6 animate-in slide-in-from-top-2">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        <div className="lg:col-span-2 space-y-5">
                          <div>
                            <h4 className="text-xs text-gray-500 font-medium tracking-wider uppercase mb-2 flex items-center">
                              <ShieldCheck size={14} className="mr-1.5" /> AI Recommended Action
                            </h4>
                            <p className="text-gray-200 bg-gray-900 border border-gray-800 p-3.5 rounded-lg text-sm leading-relaxed">
                              {alert.ai_suggested_action}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-xs text-gray-500 font-medium tracking-wider uppercase mb-2">Raw Alert Payload</h4>
                            <p className="font-mono text-xs text-gray-400 bg-black/40 p-3.5 rounded-lg border border-gray-800/60 break-words leading-relaxed">
                              {alert.raw_message}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4 pt-1 lg:pt-0">
                          <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
                            <div className="flex justify-between items-center mb-1.5">
                              <p className="text-xs text-gray-500 font-medium tracking-wider uppercase">Auto-Triage Confidence</p>
                              <span className="text-sm text-blue-400 font-bold">{alert.ai_confidence_score * 1}%</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-1.5 mt-3 overflow-hidden">
                              <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${alert.ai_confidence_score}%` }}></div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => { e.stopPropagation(); handleResolve(alert.id); }}
                            className="w-full py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-sm font-medium transition-all flex items-center justify-center space-x-2 touch-manipulation shadow-lg"
                          >
                            <CheckCircle2 size={16} />
                            <span>Mark as Resolved</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
