import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ShieldCheck, Moon, Sun, Plus, RefreshCw, MessageSquare } from 'lucide-react';
import IncidentCard from './components/IncidentCard.jsx';
import Dashboard from './components/Dashboard.jsx';
import SimulateModal from './components/SimulateModal.jsx';
import FilterBar from './components/FilterBar.jsx';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [filters, setFilters] = useState({ severity: '', status: '', category: '' });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof document !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  };

  useEffect(() => {
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.classList.remove('dark');
      setIsDarkMode(false);
    }
  }, []);
  
  const buildQuery = useCallback((f) => {
    const params = new URLSearchParams();
    if (f.severity && f.severity !== 'All') params.set('severity', f.severity);
    if (f.status && f.status !== 'All') params.set('status', f.status);
    if (f.category && f.category !== 'All') params.set('category', f.category);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/incidents${buildQuery(filters)}`);
      const incData = await res.json();
      setIncidents(Array.isArray(incData) ? incData : []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setRefreshing(false);
    }
  }, [filters, buildQuery]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleIncidentCreated = (newIncident) => {
    setIncidents((prev) => [newIncident, ...prev]);
    setSelectedId(newIncident.id);
    fetchData(true);
  };

  const handleStatusChange = (updatedIncident) => {
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === updatedIncident.id ? updatedIncident : inc))
    );
    fetchData(true);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const res = await fetch(`${API_BASE}/seed`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchData();
        if (data.data?.length > 0) setSelectedId(data.data[0].id);
      }
    } catch (err) {
      console.error('Seed failed:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${API_BASE}/incidents/reset`, { method: 'DELETE' });
      setSelectedId(null);
      await fetchData();
    } catch (err) {
      console.error('Reset failed:', err);
    }
  };

  const selectedIncident = incidents.find((inc) => inc.id === selectedId) || null;

  return (
    <div className="min-h-screen bg-background font-sans transition-colors duration-300 flex flex-col">
      {/* Clean Header */}
      <header className="header-nav">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Triage Copilot
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleDarkMode} className="text-muted-foreground hover:text-foreground">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => fetchData()}
              disabled={refreshing}
              className="px-3"
            >
              <RefreshCw size={14} className={cn("mr-2", refreshing && "animate-spin")} />
              Sync
            </Button>

            <Button onClick={() => setModalOpen(true)} className="px-4">
              <Plus size={16} className="mr-2" />
              New Incident
            </Button>
          </div>
        </div>
      </header>

      {/* Main Workspace - 2 Pane Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden">
        
        {/* Left Pane: Conversation History */}
        <div className="md:col-span-4 flex flex-col bg-card border rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-120px)]">
          <div className="p-4 border-b bg-muted/20">
            <FilterBar
              filters={filters}
              onFilterChange={setFilters}
              onSeed={handleSeed}
              onReset={handleReset}
              seeding={seeding}
            />
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {incidents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
                <MessageSquare size={32} className="mb-4 opacity-50" />
                <p className="text-sm">No incidents available.</p>
                <p className="text-xs opacity-70 mt-1">Start a new brief or load demo data.</p>
              </div>
            ) : (
              incidents.map((inc) => (
                <IncidentCard
                  key={inc.id}
                  incident={inc}
                  isSelected={selectedId === inc.id}
                  onClick={() => setSelectedId(inc.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Copilot Chat Feed */}
        <div className="md:col-span-8 bg-card border rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-120px)] flex flex-col">
          {selectedIncident ? (
             <Dashboard
               incident={selectedIncident}
               onStatusChange={handleStatusChange}
             />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <ShieldCheck size={48} className="mb-4 opacity-20" />
              <h2 className="text-xl font-medium text-foreground">Copilot Idle</h2>
              <p className="text-sm mt-2">Select an incident thread to view the assistant's analysis.</p>
            </div>
          )}
        </div>
      </main>

      <SimulateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onIncidentCreated={handleIncidentCreated}
      />
    </div>
  );
}
