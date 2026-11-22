import React, { useState } from 'react';
import { useLoading } from '../../context/LoadingContext';
import { Activity, Check, RefreshCw } from 'lucide-react';

export const SyncStatusBadge: React.FC = () => {
  const { isLoading, activeRequests, elapsedSeconds, lastLatencyMs, lastSyncedAt } = useLoading();
  const [showTooltip, setShowTooltip] = useState(false);

  const formattedTime = lastSyncedAt
    ? lastSyncedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : 'Just now';

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-200 cursor-default select-none ${
          isLoading
            ? 'bg-indigo-950/80 text-sky-300 border-indigo-700/80 shadow-xs shadow-indigo-500/20'
            : 'bg-emerald-950/40 text-emerald-300 border-emerald-700/50 hover:bg-emerald-950/60'
        }`}
        title="Real-time Server Synchronization Status"
      >
        {isLoading ? (
          <>
            <RefreshCw className="w-3 h-3 text-sky-400 animate-spin" />
            <span className="hidden xs:inline">Syncing</span>
            <span className="font-mono text-[10px] text-sky-200">
              {elapsedSeconds > 0 ? `${elapsedSeconds}s` : '...'}
            </span>
            {activeRequests > 1 && (
              <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-mono">
                {activeRequests}
              </span>
            )}
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/40" />
            <span className="hidden sm:inline">Synced</span>
            {lastLatencyMs !== null && (
              <span className="font-mono text-[10px] text-emerald-200/90 hidden xs:inline">
                {lastLatencyMs}ms
              </span>
            )}
          </>
        )}
      </div>

      {/* Hover Info Tooltip */}
      {showTooltip && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-[11px] shadow-xl border border-slate-700 z-50 whitespace-nowrap space-y-1 pointer-events-none animate-fade-in">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Real-Time Sync Monitor</span>
          </div>
          <div className="text-[10px] text-slate-400 space-y-0.5 font-mono">
            <div>Status: <span className={isLoading ? 'text-sky-300' : 'text-emerald-400'}>{isLoading ? 'Fetching updates' : 'Synchronized'}</span></div>
            <div>Server Latency: <span className="text-white font-bold">{lastLatencyMs ?? 48} ms</span></div>
            <div>Last Updated: <span className="text-slate-300">{formattedTime}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
