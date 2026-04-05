import React from 'react';
import { Filter, Zap, Trash2, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";

const SEVERITY_OPTIONS = ['All', 'Critical', 'High', 'Medium', 'Low'];
const STATUS_OPTIONS = ['All', 'open', 'acknowledged', 'resolved'];

export default function FilterBar({ filters, onFilterChange, onSeed, onReset, seeding }) {
  const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'All').length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Filter size={16} />
          <span className="text-sm font-medium">Past Threads</span>
        </div>
        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onFilterChange({ severity: 'All', status: 'All', category: 'All' })}>
              <RotateCcw size={12} />
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onSeed} disabled={seeding}>
            <Zap size={12} className="mr-1" />
            Test Data
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={onReset}>
            <Trash2 size={12} className="mr-1" />
            Clear
          </Button>
        </div>
      </div>
      
      <div className="flex gap-2">
        <select
          value={filters.severity || 'All'}
          onChange={(e) => onFilterChange({ ...filters, severity: e.target.value })}
          className="flex-1 bg-background border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option disabled>Severity</option>
          {SEVERITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
        </select>
        
        <select
          value={filters.status || 'All'}
          onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
          className="flex-1 bg-background border rounded-lg px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option disabled>Status</option>
          {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt === 'All' ? 'All' : opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
        </select>
      </div>
    </div>
  );
}
