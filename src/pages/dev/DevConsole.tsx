import React, { useState, useEffect, useCallback } from 'react';
import {
  Terminal,
  Activity,
  Server,
  Database,
  Cpu,
  RefreshCw,
  Power,
  ShieldAlert,
  Zap,
  CheckCircle2,
  Clock,
  HardDrive,
  Layers,
  Sparkles,
  AlertTriangle,
  Play,
  Trash2,
  Lock,
  Unlock,
  Radio,
  Share2,
  Table as TableIcon,
  Link,
  Sliders,
  Tv,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { InteractiveGraphVisualizer } from '../../components/dev/InteractiveGraphVisualizer';

interface DevHealthData {
  status: string;
  timestamp: string;
  latency_ms: number;
  server: {
    uptime_seconds: number;
    node_version: string;
    platform: string;
    memory_usage_mb: number;
    port: number | string;
    env: string;
  };
  database: {
    type: string;
    status: string;
    tables: {
      users: number;
      departments: number;
      submissions: number;
      activity_schema: number;
      schema_categories: number;
    };
  };
  knowledge_graph: {
    status: string;
    nodes_count: number;
    entity_types: string[];
  };
  ai_engine: {
    model: string;
    key_configured: boolean;
    key_masked: string;
  };
  maintenance: {
    active: boolean;
    reason: string;
  };
}

interface DevLogItem {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module: string;
  message: string;
}

export const DevConsole: React.FC = () => {
  const { switchPersona, personas, user } = useAuth();
  const [health, setHealth] = useState<DevHealthData | null>(null);
  const [logs, setLogs] = useState<DevLogItem[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pingResult, setPingResult] = useState<{ time: number; timestamp: string } | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  
  // Gemini Test state
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiResult, setGeminiResult] = useState<any | null>(null);
  
  // Graph Sync state
  const [isSyncingGraph, setIsSyncingGraph] = useState(false);
  const [graphSyncStatus, setGraphSyncStatus] = useState<string | null>(null);

  // Maintenance state
  const [isMaintenanceActive, setIsMaintenanceActive] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [isUpdatingMaintenance, setIsUpdatingMaintenance] = useState(false);

  // Active sub-tab in dev console
  const [activeTab, setActiveTab] = useState<'graph' | 'overview' | 'tables' | 'relationships' | 'diagnostics' | 'logs'>('graph');

  const fetchHealth = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await apiRequest<DevHealthData>('/api/dev/health');
      setHealth(data);
      setIsMaintenanceActive(data.maintenance?.active || false);
      setMaintenanceReason(data.maintenance?.reason || '');
    } catch (err) {
      console.error('Failed to fetch dev health:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const data = await apiRequest<{ logs: DevLogItem[] }>('/api/dev/logs');
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch dev logs:', err);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchLogs();
    const interval = setInterval(() => {
      fetchHealth();
      fetchLogs();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchLogs]);

  const handlePingServer = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await apiRequest<{ pong: boolean; timestamp: string }>('/api/dev/ping');
      const latency = Math.round(performance.now() - start);
      setPingResult({ time: latency, timestamp: res.timestamp });
    } catch (err) {
      console.error('Ping failed:', err);
    } finally {
      setIsPinging(false);
    }
  };

  const handleTestGemini = async () => {
    setIsTestingGemini(true);
    setGeminiResult(null);
    try {
      const res = await apiRequest<any>('/api/dev/test-gemini', { method: 'POST' });
      setGeminiResult(res);
      fetchLogs();
    } catch (err: any) {
      setGeminiResult({ success: false, error: err.message || 'Gemini Test Failed' });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleSyncGraph = async () => {
    setIsSyncingGraph(true);
    setGraphSyncStatus(null);
    try {
      const res = await apiRequest<any>('/api/dev/sync-graph', { method: 'POST' });
      setGraphSyncStatus(`Sync Success: ${res.nodes_count} Graph Nodes Indexed`);
      fetchHealth();
      fetchLogs();
    } catch (err: any) {
      setGraphSyncStatus(`Sync Failed: ${err.message}`);
    } finally {
      setIsSyncingGraph(false);
    }
  };

  const handleToggleMaintenance = async () => {
    setIsUpdatingMaintenance(true);
    const newStatus = !isMaintenanceActive;
    try {
      await apiRequest<any>('/api/dev/maintenance', {
        method: 'POST',
        body: JSON.stringify({ active: newStatus, reason: maintenanceReason }),
      });
      setIsMaintenanceActive(newStatus);
      fetchHealth();
      fetchLogs();
    } catch (err) {
      console.error('Failed to update maintenance:', err);
    } finally {
      setIsUpdatingMaintenance(false);
    }
  };

  const handleClearLogs = async () => {
    try {
      await apiRequest('/api/dev/logs/clear', { method: 'POST' });
      setLogs([]);
    } catch (err) {
      console.error('Failed to clear logs:', err);
    }
  };

  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Status Banner */}
      <div className="p-5 rounded-2xl bg-[#091124] border border-indigo-900/60 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">System Developer Console</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                DevOps Ops Console
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time server diagnostics, database telemetry, maintenance overrides & Gemini latency monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Server Ping Button */}
          <button
            onClick={handlePingServer}
            disabled={isPinging}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-2 transition cursor-pointer"
          >
            <Radio className={`w-3.5 h-3.5 text-sky-400 ${isPinging ? 'animate-ping' : ''}`} />
            <span>Ping Server</span>
            {pingResult && (
              <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-950 text-sky-300 border border-sky-800">
                {pingResult.time}ms
              </span>
            )}
          </button>

          {/* Refresh Diagnostics */}
          <button
            onClick={fetchHealth}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition cursor-pointer"
            title="Refresh System Health"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Primary KPI Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Server Status Card */}
        <div className="p-4 rounded-xl bg-[#060C1B] border border-indigo-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Server Health</span>
            <Server className="w-4 h-4 text-sky-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isMaintenanceActive ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="text-lg font-black text-white">
              {isMaintenanceActive ? 'MAINTENANCE' : 'ONLINE'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Uptime: <span className="text-slate-200 font-mono font-bold">{health ? formatUptime(health.server.uptime_seconds) : '---'}</span>
          </div>
        </div>

        {/* Database Status Card */}
        <div className="p-4 rounded-xl bg-[#060C1B] border border-indigo-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Database Storage</span>
            <Database className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300">
            SQLite WAL Mode
          </div>
          <div className="text-[11px] text-slate-400">
            Records: <span className="text-slate-200 font-mono font-bold">{health?.database.tables.submissions || 0} Submissions</span>
          </div>
        </div>

        {/* Knowledge Graph Status Card */}
        <div className="p-4 rounded-xl bg-[#060C1B] border border-indigo-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Knowledge Graph</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-lg font-black text-indigo-300">
            {health?.knowledge_graph.nodes_count || 0} Entities
          </div>
          <div className="text-[11px] text-slate-400">
            State: <span className="text-emerald-400 font-bold">10 Typed Edges</span>
          </div>
        </div>

        {/* Gemini Engine Status Card */}
        <div className="p-4 rounded-xl bg-[#060C1B] border border-indigo-900/40 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
            <span>Gemini AI Engine</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-lg font-black text-purple-300 truncate">
            gemini-3.6-flash
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            API Key: {health?.ai_engine.key_configured ? (
              <span className="text-emerald-400 font-bold">CONFIGURED</span>
            ) : (
              <span className="text-amber-400 font-bold">MISSING</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-indigo-900/50 pb-2 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'graph'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5 text-amber-400" />
          <span>Graph Visualization (ER & Live)</span>
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>System Maintenance & Operations</span>
        </button>
        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'diagnostics'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>Database & AI Engine Diagnostics</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>System Audit Logs ({logs.length})</span>
        </button>
      </div>

      {/* Tab 0: Graph Visualization (ER Diagram & Live Connections) */}
      {activeTab === 'graph' && <InteractiveGraphVisualizer />}

      {/* Tab 1: Maintenance & Operations */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Maintenance Mode Controls */}
          <div className="p-5 rounded-2xl bg-[#060C1B] border border-indigo-900/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Power className={`w-5 h-5 ${isMaintenanceActive ? 'text-amber-400' : 'text-emerald-400'}`} />
                <h3 className="text-sm font-bold text-white">System Maintenance Mode</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${isMaintenanceActive ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'}`}>
                {isMaintenanceActive ? 'MAINTENANCE ACTIVE' : 'NORMAL OPERATION'}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Enabling maintenance mode prevents new student submissions and locks schema rule changes while system upgrades or database migrations are in progress.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-400">Maintenance Announcement Message</label>
              <input
                type="text"
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                placeholder="e.g. Upgrading Credit Rules & Re-indexing Knowledge Graph"
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#091124] border border-indigo-900/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleToggleMaintenance}
              disabled={isUpdatingMaintenance}
              className={`w-full py-3 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                isMaintenanceActive
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isMaintenanceActive ? (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Disable Maintenance Mode & Resume Portal</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Enable System Maintenance Mode</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Persona Role Swapper */}
          <div className="p-5 rounded-2xl bg-[#060C1B] border border-indigo-900/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Developer 1-Click Persona Switcher</h3>
              </div>
              <span className="text-[10px] text-slate-400">Current: {user?.name} ({user?.role})</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Instantly switch into any demo persona to test student clearance progress, faculty submission verification queues, or HOD department administration.
            </p>

            <div className="space-y-2">
              {personas.map((p) => (
                <button
                  key={p.id}
                  onClick={() => switchPersona(p.id)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition cursor-pointer ${
                    user?.id === p.id
                      ? 'bg-indigo-950/80 border-indigo-500 text-white'
                      : 'bg-[#091124] border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop'}
                      alt={p.name}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-slate-400">{p.email}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    p.role === 'hod' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                    p.role === 'mentor' ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {p.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Database & Graph Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Gemini AI Latency & Engine Tester */}
          <div className="p-5 rounded-2xl bg-[#060C1B] border border-indigo-900/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Gemini 3.6 Flash Latency Tester</h3>
              </div>
              <button
                onClick={handleTestGemini}
                disabled={isTestingGemini}
                className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isTestingGemini ? 'Testing API...' : 'Run Test'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Executes a test JSON generation call to verify Gemini 3.6 Flash latency and response schema integrity.
            </p>

            {geminiResult && (
              <div className="p-3.5 rounded-xl bg-[#091124] border border-indigo-900/60 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Status: <b className={geminiResult.success ? 'text-emerald-400' : 'text-amber-400'}>{geminiResult.success ? 'SUCCESS' : 'FAILED'}</b></span>
                  <span>Latency: <b className="text-purple-300">{geminiResult.latency_ms} ms</b></span>
                </div>
                {geminiResult.output && (
                  <pre className="p-2.5 rounded bg-[#040812] border border-slate-800 text-slate-200 overflow-x-auto text-[11px]">
                    {JSON.stringify(geminiResult.output, null, 2)}
                  </pre>
                )}
                {geminiResult.error && (
                  <div className="text-amber-400 text-xs">{geminiResult.error}</div>
                )}
              </div>
            )}
          </div>

          {/* Knowledge Graph Re-index Controller */}
          <div className="p-5 rounded-2xl bg-[#060C1B] border border-indigo-900/50 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white">Knowledge Graph Synchronizer</h3>
              </div>
              <button
                onClick={handleSyncGraph}
                disabled={isSyncingGraph}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-bold text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingGraph ? 'animate-spin' : ''}`} />
                <span>{isSyncingGraph ? 'Syncing...' : 'Force Re-Index Graph'}</span>
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Synthesizes relational SQLite records into the in-memory graph topology of 10 node types and 10 typed edge relationships.
            </p>

            {graphSyncStatus && (
              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-900/60 text-xs text-sky-200 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-400" />
                <span>{graphSyncStatus}</span>
              </div>
            )}

            {/* Table Stats Breakdown */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              <div className="p-2.5 rounded-lg bg-[#091124] border border-slate-800">
                <div className="text-slate-400 text-[10px]">Users Table</div>
                <div className="text-base font-extrabold text-white mt-0.5">{health?.database.tables.users || 0} Accounts</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#091124] border border-slate-800">
                <div className="text-slate-400 text-[10px]">Activity Rules Schema</div>
                <div className="text-base font-extrabold text-white mt-0.5">{health?.database.tables.activity_schema || 0} Rules</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Audit Logs Stream */}
      {activeTab === 'logs' && (
        <div className="p-5 rounded-2xl bg-[#060C1B] border border-indigo-900/50 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">System Diagnostics Log Stream</h3>
            </div>
            <button
              onClick={handleClearLogs}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Logs</span>
            </button>
          </div>

          <div className="space-y-1.5 font-mono text-xs max-h-96 overflow-y-auto pr-1">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No logs captured yet.</div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-lg bg-[#091124] border border-slate-800/80 flex items-start justify-between gap-3 text-slate-300"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                      log.level === 'error' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      log.level === 'warn' ? 'bg-amber-400/20 text-amber-200 border border-amber-400/30' :
                      log.level === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    }`}>
                      {log.module}
                    </span>
                    <span className="truncate">{log.message}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
