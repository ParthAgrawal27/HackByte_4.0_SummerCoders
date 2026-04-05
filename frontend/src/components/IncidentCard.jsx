import React from 'react';
import { ShieldAlert, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from "@/lib/utils";

const severityConfig = {
  critical: { color: 'text-destructive', bg: 'bg-destructive/10', icon: ShieldAlert },
  high:     { color: 'text-orange-500', bg: 'bg-orange-500/10', icon: AlertTriangle },
  medium:   { color: 'text-yellow-600', bg: 'bg-yellow-500/10', icon: AlertCircle },
  low:      { color: 'text-green-500', bg: 'bg-green-500/10', icon: CheckCircle2 },
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function IncidentCard({ incident, isSelected, onClick }) {
  const sev = (incident.severity || 'low').toLowerCase();
  const config = severityConfig[sev] || severityConfig.low;
  const SevIcon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 rounded-xl transition-all duration-200 border cursor-pointer border-transparent",
        isSelected
          ? "bg-primary/5 border-primary/20"
          : "hover:bg-muted/50"
      )}
    >
      <div className="flex gap-3 items-start">
        <div className={cn("mt-1 shrink-0 p-2 rounded-full", config.bg, config.color)}>
          <SevIcon size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className="font-semibold text-sm text-foreground truncate mr-2">
              {incident.service || 'System'} Alert
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timeAgo(incident.created_at)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {incident.alert_text}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded", config.bg, config.color)}>
              {incident.severity}
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              {incident.id}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
