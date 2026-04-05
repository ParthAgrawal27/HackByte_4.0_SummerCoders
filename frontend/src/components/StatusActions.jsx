import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Merge, XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

const API_BASE = 'http://127.0.0.1:8000';

export default function StatusActions({ incident, onStatusChange }) {
  const [loading, setLoading] = useState(false);

  if (!incident) return null;

  const handleAction = async (endpoint) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/incidents/${incident.id}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        // Optimistic refresh
        const fresh = await fetch(`${API_BASE}/api/incidents/${incident.id}`);
        const data = await fresh.json();
        onStatusChange && onStatusChange(data);
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusOnly = async (statusStr) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/incidents/${incident.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: statusStr }),
      });
      const data = await res.json();
      onStatusChange && onStatusChange(data);
    } catch (err) {
      console.error('Status fail:', err);
    } finally {
       setLoading(false);
    }
  };

  if (incident.status === 'PR Opened' || incident.status === 'Pending') {
    return (
      <div className="flex gap-2 p-1">
        <Button 
          variant="default" 
          disabled={loading || incident.status === 'Pending'} 
          onClick={() => handleAction('merge')}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Merge size={16} className="mr-2"/> Merge PR
        </Button>
        <Button 
          variant="outline" 
          disabled={loading || incident.status === 'Pending'} 
          onClick={() => handleAction('reject')}
          className="border-destructive/30 text-destructive hover:bg-destructive/10"
        >
          <XCircle size={16} className="mr-2"/> Reject PR
        </Button>
      </div>
    );
  }

  if (incident.status === 'Acknowledged' || incident.status === 'Failed') {
    return (
       <div className="flex gap-2 p-1">
          <Button disabled={loading} onClick={() => handleStatusOnly('Resolved')} variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
            <CheckCircle2 size={16} className="mr-2"/> Mark Resolved
          </Button>
       </div>
    );
  }

  return null;
}
