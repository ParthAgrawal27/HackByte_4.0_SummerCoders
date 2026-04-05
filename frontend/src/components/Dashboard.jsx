import React from 'react';
import { Bot, User, CheckCircle2, AlertCircle, FileCode2, Merge, XCircle } from 'lucide-react';
import StatusActions from './StatusActions.jsx';
import { cn } from "@/lib/utils";

export default function Dashboard({ incident, onStatusChange }) {
  if (!incident) return null;

  return (
    <div className="flex flex-col h-full relative">
      {/* Thread Header */}
      <div className="flex flex-col p-4 border-b bg-surface-base sticky top-0 z-10 shadow-sm">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          {incident.service || 'System'} Alert Timeline
        </h2>
        <span className="text-sm text-muted-foreground font-mono">Thread ID: {incident.id}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
        {/* System Alert Message */}
        <div className="chat-system">
          System detected an anomaly and created a support ticket on {new Date(incident.created_at).toLocaleString()}
        </div>

        {/* User context representing the alert */}
        <div className="flex gap-4">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <AlertCircle size={16} className="text-muted-foreground" />
          </div>
          <div className="flex flex-col gap-1 items-start">
            <span className="text-xs font-semibold text-muted-foreground ml-1">SYSTEM MONITOR</span>
            <div className="px-4 py-3 rounded-2xl max-w-[85%] border shadow-sm bg-muted text-foreground rounded-tl-sm">
              <p className="font-medium text-destructive mb-2">{incident.alert_text}</p>
              <pre className="text-xs font-mono bg-background p-3 rounded-md overflow-x-auto text-muted-foreground border">
                {incident.logs}
              </pre>
            </div>
          </div>
        </div>

        {/* Copilot Analysis Message */}
        {incident.status !== "Pending" && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
              <Bot size={16} className="text-primary-foreground" />
            </div>
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs font-semibold text-primary ml-1">TRIAGE COPILOT</span>
              <div className="px-4 py-3 rounded-2xl max-w-[85%] border shadow-sm bg-card text-card-foreground rounded-tl-sm w-full">
                <p className="text-sm mb-3">Hi there, I've analyzed the logs and flagged this as a <strong>{incident.severity}</strong> severity issue.</p>
                <div className="bg-muted p-3 rounded-lg border text-sm mb-3">
                  <h4 className="font-semibold mb-1 text-foreground flex items-center gap-1"><AlertCircle size={14}/> Root Cause</h4>
                  <p className="text-muted-foreground">{incident.root_cause || "Analyzing root cause..."}</p>
                </div>
                
                {incident.pr_url ? (
                  <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 text-sm">
                    <h4 className="font-semibold mb-1 text-primary flex items-center gap-1"><FileCode2 size={14}/> Generated Patch</h4>
                    <p className="text-muted-foreground mb-2">I have successfully opened a pull request with the resolution code.</p>
                    <a href={incident.pr_url} target="_blank" rel="noreferrer" className="text-primary underline font-medium break-all">
                      {incident.pr_url}
                    </a>
                  </div>
                ) : (
                  <div className="bg-muted p-3 rounded-lg border text-sm text-muted-foreground italic">
                    I was unable to automatically generate a GitHub patch for this specific issue. Escalating to human on-call.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Copilot Action Request */}
        {(incident.status === 'PR Opened' || incident.status === 'Pending') && (
           <div className="flex gap-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-md">
              <Bot size={16} className="text-primary-foreground" />
            </div>
            <div className="flex flex-col gap-1 items-start">
              <span className="text-xs font-semibold text-primary ml-1">TRIAGE COPILOT</span>
              <div className="px-4 py-3 rounded-2xl max-w-[85%] border shadow-sm bg-card text-card-foreground rounded-tl-sm text-sm">
                {incident.status === 'Pending' 
                  ? <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin"/> Analyzing the codebase and preparing a resolution...</div>
                  : "Please review the pull request. Should I merge it to production or reject and close it?"}
              </div>
            </div>
          </div>
        )}

        {/* Resolution State */}
        {(incident.status === 'Resolved' || incident.status === 'Rejected') && (
           <div className="chat-system flex items-center gap-2 justify-center">
             {incident.status === 'Resolved' ? (
               <><CheckCircle2 size={14} className="text-green-500" /> Incident Resolved. PR merged successfully.</>
             ) : (
               <><XCircle size={14} className="text-red-500" /> Incident Rejected. PR closed without merging.</>
             )}
           </div>
        )}
      </div>

      {/* Floating Action Bar */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center w-full px-4 pt-10 pb-2 pointer-events-none bg-gradient-to-t from-background via-background to-transparent">
         <div className="pointer-events-auto shadow-2xl rounded-2xl border bg-card p-1">
           <StatusActions incident={incident} onStatusChange={onStatusChange} />
         </div>
      </div>
    </div>
  );
}
