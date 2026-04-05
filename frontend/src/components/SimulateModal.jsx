import React, { useState } from 'react';
import { AlertCircle, Terminal, FileText, Send, Zap, X } from 'lucide-react';
import { Button } from "@/components/ui/button";

const API_BASE = 'http://127.0.0.1:8000';

export default function SimulateModal({ isOpen, onClose, onIncidentCreated }) {
  const [mode, setMode] = useState('simulate'); // 'simulate' or 'custom'
  const [alert, setAlert] = useState('');
  const [logs, setLogs] = useState('');
  const [runbook, setRunbook] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/simulate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Simulation failed');
      onIncidentCreated(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/simulate`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_text: alert, logs, runbook }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      onIncidentCreated(data);
      setAlert('');
      setLogs('');
      setRunbook('');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl animate-fade-in-up overflow-hidden text-card-foreground">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/20">
          <h2 className="text-lg font-semibold text-foreground">New Incident</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <X size={18} />
          </Button>
        </div>

        {/* Tab switch */}
        <div className="flex p-1.5 mx-5 mt-4 bg-muted/30 rounded-xl border border-border">
          <button
            onClick={() => setMode('simulate')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'simulate'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap size={14} /> Quick Simulate
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'custom'
                ? 'bg-background text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Terminal size={14} /> Custom Alert
          </button>
        </div>

        <div className="p-5">
          {error && (
            <div className="mb-4 bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-xl text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {mode === 'simulate' ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                <Zap size={28} className="text-primary" />
              </div>
              <div>
                <p className="text-foreground font-medium text-lg">Simulate a Real Incident</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Fires a realistic alert scenario through the AI pipeline
                </p>
              </div>
              <Button
                onClick={handleSimulate}
                disabled={loading}
                className="w-full mt-4 h-12 text-base font-medium shadow-sm transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="loading-spinner w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                    AI Analyzing...
                  </span>
                ) : (
                  <>
                    <Zap size={16} className="mr-2" />
                    Launch Simulated Alert
                  </>
                )}
              </Button>
            </div>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <AlertCircle size={14} className="mr-1.5 text-muted-foreground" /> Alert Message
                </label>
                <input
                  type="text"
                  required
                  value={alert}
                  onChange={(e) => setAlert(e.target.value)}
                  placeholder="e.g. HIGH CPU USAGE on database"
                  className="w-full bg-background border border-input text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <Terminal size={14} className="mr-1.5 text-muted-foreground" /> Recent Logs
                </label>
                <textarea
                  rows={4}
                  value={logs}
                  onChange={(e) => setLogs(e.target.value)}
                  placeholder="Paste application or system logs here..."
                  className="w-full bg-background border border-input text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm resize-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center text-sm font-medium text-foreground">
                  <FileText size={14} className="mr-1.5 text-muted-foreground" /> Runbook Context
                </label>
                <textarea
                  rows={2}
                  value={runbook}
                  onChange={(e) => setRunbook(e.target.value)}
                  placeholder="Provide any known context..."
                  className="w-full bg-background border border-input text-foreground rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ring transition-all text-sm resize-none font-mono"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !alert}
                className="w-full h-12 text-base font-medium transition-all"
              >
                {loading ? (
                   <span className="flex items-center gap-2">
                    <span className="loading-spinner w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></span>
                    AI Analyzing...
                  </span>
                ) : (
                  <>
                    <Send size={16} className="mr-2" />
                    Analyze Custom Incident
                  </>
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
