import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Database,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  Eye,
  EyeOff,
  Tv,
  Key,
  Link,
  Table as TableIcon,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Minimize2,
  CheckCircle2,
  Share2,
  Sliders,
  X,
  Activity,
  User,
  GraduationCap,
  ShieldCheck,
  FileText,
  Tag,
} from 'lucide-react';
import { apiRequest } from '../../lib/api';

interface ColumnMeta {
  name: string;
  type: string;
  isPk: boolean;
  notNull: boolean;
  defaultValue: any;
}

interface ForeignKeyMeta {
  fromColumn: string;
  toTable: string;
  toColumn: string;
}

interface TableNode {
  id: string;
  name: string;
  recordCount: number;
  category: string;
  columns: ColumnMeta[];
  foreignKeys: ForeignKeyMeta[];
  primaryKeys: string[];
  x?: number;
  y?: number;
  expanded?: boolean;
}

interface SchemaRelationship {
  id: string;
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  targetColumn: string;
  cardinality: string;
  label: string;
}

interface LiveGraphNode {
  id: string;
  label: string;
  type: string;
  category: string;
  details: Record<string, any>;
  x?: number;
  y?: number;
}

interface LiveGraphEdge {
  id: string;
  source: string;
  target: string;
  relation: string;
  label: string;
}

interface InteractiveGraphVisualizerProps {
  onSelectTable?: (tableName: string) => void;
}

export const InteractiveGraphVisualizer: React.FC<InteractiveGraphVisualizerProps> = ({
  onSelectTable,
}) => {
  // Mode: 'schema' (ER Schema) vs 'live' (Live Record Connections)
  const [graphMode, setGraphMode] = useState<'schema' | 'live'>('schema');

  // Schema data
  const [tables, setTables] = useState<TableNode[]>([]);
  const [relationships, setRelationships] = useState<SchemaRelationship[]>([]);
  const [schemaMeta, setSchemaMeta] = useState<{
    database_type: string;
    table_count: number;
    relationship_count: number;
    total_records: number;
  }>({
    database_type: 'SQLite 3 (WAL)',
    table_count: 0,
    relationship_count: 0,
    total_records: 0,
  });

  // Live graph data
  const [liveNodes, setLiveNodes] = useState<LiveGraphNode[]>([]);
  const [liveEdges, setLiveEdges] = useState<LiveGraphEdge[]>([]);

  // Telemetry & Sync
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Canvas View Controls
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showLines, setShowLines] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Drag state
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanningCanvas, setIsPanningCanvas] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef<HTMLDivElement>(null);

  // Position Nodes in a nice initial layout grid
  const layoutSchemaNodes = useCallback((tableList: TableNode[]) => {
    const cols = 3;
    const spacingX = 340;
    const spacingY = 280;
    return tableList.map((t, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        ...t,
        x: t.x !== undefined ? t.x : 50 + col * spacingX,
        y: t.y !== undefined ? t.y : 50 + row * spacingY,
        expanded: t.expanded !== undefined ? t.expanded : true,
      };
    });
  }, []);

  const layoutLiveNodes = useCallback((nodeList: LiveGraphNode[]) => {
    const cols = 4;
    const spacingX = 260;
    const spacingY = 180;
    return nodeList.map((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      return {
        ...n,
        x: n.x !== undefined ? n.x : 40 + col * spacingX,
        y: n.y !== undefined ? n.y : 40 + row * spacingY,
      };
    });
  }, []);

  const fetchSchemaData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<any>('/api/dev/db-schema');
      const positioned = layoutSchemaNodes(data.tables || []);
      setTables(positioned);
      setRelationships(data.relationships || []);
      setSchemaMeta({
        database_type: data.database_type || 'SQLite 3 (WAL)',
        table_count: data.table_count || 0,
        relationship_count: data.relationship_count || 0,
        total_records: data.total_records || 0,
      });
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to fetch ER schema:', err);
    } finally {
      setIsLoading(false);
    }
  }, [layoutSchemaNodes]);

  const fetchLiveGraphData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<any>('/api/dev/live-graph');
      const positioned = layoutLiveNodes(data.nodes || []);
      setLiveNodes(positioned);
      setLiveEdges(data.edges || []);
      setLastSyncTime(new Date());
    } catch (err) {
      console.error('Failed to fetch live graph data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [layoutLiveNodes]);

  useEffect(() => {
    if (graphMode === 'schema') {
      fetchSchemaData();
    } else {
      fetchLiveGraphData();
    }
  }, [graphMode, fetchSchemaData, fetchLiveGraphData]);

  // Sync Timer Counter
  useEffect(() => {
    const timer = setInterval(() => {
      if (lastSyncTime) {
        const diff = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
        setSecondsAgo(diff);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  // Highlight connections
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const connected = new Set<string>();
    connected.add(selectedNodeId);

    if (graphMode === 'schema') {
      relationships.forEach((rel) => {
        if (rel.sourceTable === selectedNodeId) connected.add(rel.targetTable);
        if (rel.targetTable === selectedNodeId) connected.add(rel.sourceTable);
      });
    } else {
      liveEdges.forEach((edge) => {
        if (edge.source === selectedNodeId) connected.add(edge.target);
        if (edge.target === selectedNodeId) connected.add(edge.source);
      });
    }
    return connected;
  }, [selectedNodeId, graphMode, relationships, liveEdges]);

  // Filtering by search
  const filteredTableIds = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const matches = new Set<string>();

    if (graphMode === 'schema') {
      tables.forEach((t) => {
        if (t.name.toLowerCase().includes(q)) matches.add(t.id);
        if (t.columns.some((c) => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q))) {
          matches.add(t.id);
        }
      });
    } else {
      liveNodes.forEach((n) => {
        if (n.label.toLowerCase().includes(q) || n.type.toLowerCase().includes(q)) matches.add(n.id);
      });
    }
    return matches;
  }, [searchQuery, graphMode, tables, liveNodes]);

  // Dragging Canvas or Nodes
  const handleMouseDownCanvas = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.graph-node')) return;
    setIsPanningCanvas(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (isPanningCanvas) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggingNodeId) {
      const zoomFactor = zoom || 1;
      const dx = (e.clientX - dragOffset.x) / zoomFactor;
      const dy = (e.clientY - dragOffset.y) / zoomFactor;

      if (graphMode === 'schema') {
        setTables((prev) =>
          prev.map((n) => (n.id === draggingNodeId ? { ...n, x: (n.x || 0) + dx, y: (n.y || 0) + dy } : n))
        );
      } else {
        setLiveNodes((prev) =>
          prev.map((n) => (n.id === draggingNodeId ? { ...n, x: (n.x || 0) + dx, y: (n.y || 0) + dy } : n))
        );
      }
      setDragOffset({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUpCanvas = () => {
    setIsPanningCanvas(false);
    setDraggingNodeId(null);
  };

  const handleNodeMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    setSelectedNodeId(nodeId);
    setDraggingNodeId(nodeId);
    setDragOffset({ x: e.clientX, y: e.clientY });
  };

  const toggleExpandNode = (nodeId: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === nodeId ? { ...t, expanded: !t.expanded } : t))
    );
  };

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 40, y: 40 });
    setSelectedNodeId(null);
    setSearchQuery('');
  };

  const handleAutoLayout = () => {
    if (graphMode === 'schema') {
      setTables(layoutSchemaNodes(tables));
    } else {
      setLiveNodes(layoutLiveNodes(liveNodes));
    }
    handleResetView();
  };

  // Node Colors Map
  const getNodeBadgeColor = (category: string) => {
    switch (category) {
      case 'core_identity':
      case 'hod':
      case 'mentor':
      case 'student':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'academic_workflow':
      case 'submission':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'rules_taxonomy':
      case 'activity':
      case 'category':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'graph_events':
      case 'department':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    }
  };

  return (
    <div
      className={`space-y-4 transition-all duration-300 ${
        isPresentationMode
          ? 'fixed inset-0 z-50 bg-[#040812] p-6 flex flex-col justify-between overflow-hidden'
          : 'relative'
      }`}
    >
      {/* Real-time Status Header */}
      <div className="p-4 rounded-2xl bg-[#091124] border border-indigo-900/60 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Database Architecture & Relationship Graph
              </h2>
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Introspected directly from active SQLite engine & Knowledge Graph memory
            </p>
          </div>
        </div>

        {/* Status Metrics Bar */}
        <div className="flex items-center gap-4 text-xs font-mono text-slate-300 bg-[#040812] px-3.5 py-2 rounded-xl border border-indigo-950 flex-wrap">
          <div>
            Engine: <span className="text-emerald-400 font-bold">{schemaMeta.database_type}</span>
          </div>
          <div className="text-slate-600">|</div>
          <div>
            Sync: <span className="text-indigo-300">{secondsAgo}s ago</span>
          </div>
          <div className="text-slate-600">|</div>
          <div>
            Tables: <span className="text-amber-300 font-bold">{schemaMeta.table_count}</span>
          </div>
          <div className="text-slate-600">|</div>
          <div>
            Relationships: <span className="text-sky-300 font-bold">{schemaMeta.relationship_count}</span>
          </div>
          <div className="text-slate-600">|</div>
          <div>
            Total Records: <span className="text-purple-300 font-bold">{schemaMeta.total_records}</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Mode Toggle, Search, Controls */}
      <div className="p-3 rounded-2xl bg-[#060C1B] border border-indigo-900/50 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Graph Mode Selector */}
        <div className="flex items-center p-1 bg-[#091124] rounded-xl border border-indigo-900/60 w-full sm:w-auto">
          <button
            onClick={() => {
              setGraphMode('schema');
              setSelectedNodeId(null);
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              graphMode === 'schema'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            <span>ER Schema Graph</span>
          </button>
          <button
            onClick={() => {
              setGraphMode('live');
              setSelectedNodeId(null);
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              graphMode === 'live'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Live Connections ({liveNodes.length})</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              graphMode === 'schema'
                ? 'Search tables, columns, PK/FK...'
                : 'Search live student, mentor, or submission nodes...'
            }
            className="w-full pl-8 pr-8 py-1.5 text-xs bg-[#091124] border border-indigo-900/60 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2 text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Control Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end flex-wrap">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.15, 2))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-bold transition cursor-pointer"
            title="Reset Zoom & Pan"
          >
            {Math.round(zoom * 100)}%
          </button>

          <button
            onClick={handleAutoLayout}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Auto-Layout Grid"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowLines(!showLines)}
            className={`p-2 rounded-lg transition cursor-pointer ${
              showLines ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}
            title="Toggle Relationship Edges"
          >
            {showLines ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Presentation Mode Toggle */}
          <button
            onClick={() => setIsPresentationMode(!isPresentationMode)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              isPresentationMode
                ? 'bg-amber-500 text-slate-950 shadow-lg'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isPresentationMode ? <Minimize2 className="w-4 h-4" /> : <Tv className="w-4 h-4" />}
            <span>{isPresentationMode ? 'Exit Demo' : 'Presentation Mode'}</span>
          </button>
        </div>
      </div>

      {/* Main Graph Canvas Container */}
      <div
        ref={canvasRef}
        onMouseDown={handleMouseDownCanvas}
        onMouseMove={handleMouseMoveCanvas}
        onMouseUp={handleMouseUpCanvas}
        className={`relative rounded-2xl bg-[#040812] border border-indigo-900/60 overflow-hidden select-none cursor-grab active:cursor-grabbing ${
          isPresentationMode ? 'flex-1 h-full' : 'h-[600px]'
        }`}
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(99, 102, 241, 0.15) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      >
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-[#040812]/80 z-20 flex items-center justify-center gap-3 text-indigo-300 text-sm font-bold">
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span>Introspecting Database Topology...</span>
          </div>
        )}

        {/* Transform Canvas Layer */}
        <div
          className="absolute inset-0 origin-top-left transition-transform duration-75"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          {/* SVG Connector Lines Layer */}
          {showLines && (
            <svg className="absolute inset-0 w-[4000px] h-[4000px] pointer-events-none overflow-visible">
              <defs>
                <marker
                  id="arrow-head"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#818cf8" />
                </marker>
                <marker
                  id="arrow-head-highlight"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
              </defs>

              {/* ER Schema Relationship Lines */}
              {graphMode === 'schema' &&
                relationships.map((rel) => {
                  const source = tables.find((t) => t.id === rel.sourceTable);
                  const target = tables.find((t) => t.id === rel.targetTable);
                  if (!source || !target) return null;

                  const sx = (source.x || 0) + 140;
                  const sy = (source.y || 0) + 40;
                  const tx = (target.x || 0) + 140;
                  const ty = (target.y || 0) + 40;

                  const isHighlighted =
                    selectedNodeId &&
                    (rel.sourceTable === selectedNodeId || rel.targetTable === selectedNodeId);

                  const opacity = selectedNodeId ? (isHighlighted ? 1 : 0.15) : 0.6;
                  const strokeColor = isHighlighted ? '#f59e0b' : '#6366f1';
                  const strokeWidth = isHighlighted ? 3 : 1.8;

                  // Curved Bezier Path
                  const dx = tx - sx;
                  const dy = ty - sy;
                  const cx1 = sx + dx / 2;
                  const cy1 = sy;
                  const cx2 = sx + dx / 2;
                  const cy2 = ty;

                  const pathD = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;

                  return (
                    <g key={rel.id} style={{ opacity }}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray={isHighlighted ? 'none' : '4 3'}
                        markerEnd={isHighlighted ? 'url(#arrow-head-highlight)' : 'url(#arrow-head)'}
                      />
                      {/* Edge Label Badge */}
                      <rect
                        x={(sx + tx) / 2 - 35}
                        y={(sy + ty) / 2 - 10}
                        width="70"
                        height="18"
                        rx="4"
                        fill="#091124"
                        stroke={strokeColor}
                        strokeWidth="1"
                      />
                      <text
                        x={(sx + tx) / 2}
                        y={(sy + ty) / 2 + 3}
                        textAnchor="middle"
                        fill={isHighlighted ? '#f59e0b' : '#c7d2fe'}
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {rel.sourceColumn} (1:N)
                      </text>
                    </g>
                  );
                })}

              {/* Live Connection Edges */}
              {graphMode === 'live' &&
                liveEdges.map((edge) => {
                  const source = liveNodes.find((n) => n.id === edge.source);
                  const target = liveNodes.find((n) => n.id === edge.target);
                  if (!source || !target) return null;

                  const sx = (source.x || 0) + 110;
                  const sy = (source.y || 0) + 30;
                  const tx = (target.x || 0) + 110;
                  const ty = (target.y || 0) + 30;

                  const isHighlighted =
                    selectedNodeId && (edge.source === selectedNodeId || edge.target === selectedNodeId);

                  const opacity = selectedNodeId ? (isHighlighted ? 1 : 0.15) : 0.6;
                  const strokeColor = isHighlighted ? '#f59e0b' : '#a855f7';

                  const pathD = `M ${sx} ${sy} Q ${(sx + tx) / 2} ${(sy + ty) / 2 - 40} ${tx} ${ty}`;

                  return (
                    <g key={edge.id} style={{ opacity }}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isHighlighted ? 3 : 1.8}
                        markerEnd={isHighlighted ? 'url(#arrow-head-highlight)' : 'url(#arrow-head)'}
                      />
                      <rect
                        x={(sx + tx) / 2 - 30}
                        y={(sy + ty) / 2 - 10}
                        width="60"
                        height="16"
                        rx="3"
                        fill="#060C1B"
                        stroke={strokeColor}
                        strokeWidth="1"
                      />
                      <text
                        x={(sx + tx) / 2}
                        y={(sy + ty) / 2 + 2}
                        textAnchor="middle"
                        fill="#e9d5ff"
                        fontSize="8"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {edge.relation}
                      </text>
                    </g>
                  );
                })}
            </svg>
          )}

          {/* Render ER Schema Table Nodes */}
          {graphMode === 'schema' &&
            tables.map((t) => {
              const isSelected = selectedNodeId === t.id;
              const isConnected = connectedNodeIds.has(t.id);
              const isFiltered = filteredTableIds ? filteredTableIds.has(t.id) : true;

              let dimOpacity = 1;
              if (selectedNodeId && !isConnected) dimOpacity = 0.25;
              if (filteredTableIds && !isFiltered) dimOpacity = 0.15;

              return (
                <div
                  key={t.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, t.id)}
                  onClick={() => onSelectTable && onSelectTable(t.name)}
                  className={`graph-node absolute rounded-xl bg-[#091124] border shadow-2xl transition-all cursor-pointer ${
                    isSelected
                      ? 'border-amber-400 ring-4 ring-amber-400/20 z-30 scale-105'
                      : isConnected && selectedNodeId
                      ? 'border-indigo-400 ring-2 ring-indigo-400/20 z-20'
                      : 'border-indigo-900/70 hover:border-indigo-500 z-10'
                  }`}
                  style={{
                    left: `${t.x || 0}px`,
                    top: `${t.y || 0}px`,
                    width: isPresentationMode ? '310px' : '270px',
                    opacity: dimOpacity,
                  }}
                >
                  {/* Table Header */}
                  <div className="p-3 border-b border-indigo-900/60 flex items-center justify-between bg-gradient-to-r from-indigo-950/80 to-[#091124] rounded-t-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      <TableIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-mono font-black text-white text-xs truncate uppercase tracking-wider">
                        {t.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {t.recordCount} rows
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpandNode(t.id);
                        }}
                        className="text-slate-400 hover:text-white p-0.5"
                      >
                        {t.expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Columns List */}
                  {t.expanded && (
                    <div className="p-2 space-y-1 font-mono text-[11px] max-h-56 overflow-y-auto">
                      {t.columns.map((col) => {
                        const isFk = t.foreignKeys.some((fk) => fk.fromColumn === col.name);
                        return (
                          <div
                            key={col.name}
                            className={`p-1.5 rounded-lg flex items-center justify-between gap-2 border ${
                              col.isPk
                                ? 'bg-amber-950/30 border-amber-800/50 text-amber-200'
                                : isFk
                                ? 'bg-sky-950/30 border-sky-800/50 text-sky-200'
                                : 'bg-[#040812] border-slate-800/60 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              {col.isPk ? (
                                <Key className="w-3 h-3 text-amber-400 shrink-0" title="Primary Key (PK)" />
                              ) : isFk ? (
                                <Link className="w-3 h-3 text-sky-400 shrink-0" title="Foreign Key (FK)" />
                              ) : (
                                <span className="w-3 text-center text-slate-600 font-bold">•</span>
                              )}
                              <span className="font-bold truncate">{col.name}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 font-normal">
                              {col.type}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Render Live Record Nodes */}
          {graphMode === 'live' &&
            liveNodes.map((n) => {
              const isSelected = selectedNodeId === n.id;
              const isConnected = connectedNodeIds.has(n.id);
              const isFiltered = filteredTableIds ? filteredTableIds.has(n.id) : true;

              let dimOpacity = 1;
              if (selectedNodeId && !isConnected) dimOpacity = 0.25;
              if (filteredTableIds && !isFiltered) dimOpacity = 0.15;

              return (
                <div
                  key={n.id}
                  onMouseDown={(e) => handleNodeMouseDown(e, n.id)}
                  className={`graph-node absolute rounded-xl bg-[#091124] border shadow-xl transition-all cursor-pointer p-3 space-y-2 ${
                    isSelected
                      ? 'border-amber-400 ring-4 ring-amber-400/20 z-30 scale-105'
                      : isConnected && selectedNodeId
                      ? 'border-purple-400 ring-2 ring-purple-400/20 z-20'
                      : 'border-indigo-900/60 hover:border-purple-500 z-10'
                  }`}
                  style={{
                    left: `${n.x || 0}px`,
                    top: `${n.y || 0}px`,
                    width: isPresentationMode ? '250px' : '210px',
                    opacity: dimOpacity,
                  }}
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getNodeBadgeColor(n.category)}`}>
                      {n.type}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono truncate max-w-[90px]">{n.id}</span>
                  </div>

                  <div className="font-bold text-xs text-white truncate" title={n.label}>
                    {n.label}
                  </div>

                  {n.details && (
                    <div className="text-[10px] font-mono text-slate-400 space-y-0.5 pt-1 border-t border-slate-900">
                      {Object.entries(n.details).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="text-slate-500">{k}:</span>
                          <span className="text-slate-200 font-semibold truncate max-w-[110px]">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* Floating Help Badge */}
        <div className="absolute bottom-3 left-3 bg-[#091124]/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-900/60 text-[11px] text-slate-300 flex items-center gap-2 pointer-events-none">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Click node to highlight connected entities • Drag canvas or nodes to re-arrange layout</span>
        </div>
      </div>
    </div>
  );
};
