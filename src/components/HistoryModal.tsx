import React, { useState, useEffect, useMemo } from 'react';
import { SimulationResult, ScenarioType } from '../types';
import { getAdaptabilityScore, getMemoryInMB, getPathOptimality } from '../utils/metricsHelpers';
import { NetworkCanvas } from './NetworkCanvas'; 
import { StrategyMapEvents } from './simulation/StrategyMapEvents';

export interface HistoryEntry {
  id: string;
  runNumber: number;
  name: string; 
  algorithm: string;
  scenario: ScenarioType; 
  simResult: SimulationResult; 
  multiResults?: { bfs: SimulationResult, dfs: SimulationResult, hybrid: SimulationResult };
  optimalPathLength: number;
  totalNodes: number;
  timestamp: Date | string; 
  metadata?: {
    mapId?: string;
    gameBoard?: string;
    networkRoutingMode?: string;
    deliveryMode?: string;
    sourceDevice?: string;
    destinationDevices?: string[];
    robotAssignments?: any[];
    evacuationSourceId?: string | null;
    syntheticSizing?: { nodes: number; edges: number };
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  scenario?: ScenarioType;
  onDeleteHistory: (ids: string[]) => void;
  onImportHistory: (entries: HistoryEntry[]) => void;
}

const SCENARIO_BADGES: Record<string, string> = {
  network: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warehouse: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  traffic: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

// Helper utility to safely extract primitive values from MetricsPanel object returns
const extractPrimitive = (val: any): string | number => {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'object') {
    return val.score ?? val.value ?? val.label ?? val.text ?? Object.values(val)[0] as string | number;
  }
  return val;
};

type AlgorithmKey = 'bfs' | 'dfs' | 'hybrid';
type HistoryResults = Partial<Record<AlgorithmKey, SimulationResult>>;

const isMultiAlgorithmResult = (value: unknown): value is HistoryResults => {
  const result = value as HistoryResults | null;
  return Boolean(result && typeof result === 'object' && (result.bfs || result.dfs || result.hybrid));
};

const getEntryResults = (entry: HistoryEntry): HistoryResults => {
  if (entry.multiResults) return entry.multiResults;
  if (isMultiAlgorithmResult(entry.simResult as unknown)) return entry.simResult as unknown as HistoryResults;

  const algorithm = entry.algorithm?.toLowerCase() as AlgorithmKey;
  if (algorithm === 'bfs' || algorithm === 'dfs' || algorithm === 'hybrid') {
    return { [algorithm]: entry.simResult } as HistoryResults;
  }

  return { hybrid: entry.simResult };
};

export const HistoryModal: React.FC<Props> = ({ isOpen, onClose, history, scenario, onDeleteHistory, onImportHistory }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeEntry, setActiveEntry] = useState<HistoryEntry | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [robotAlgo, setRobotAlgo] = useState<'bfs'|'dfs'|'hybrid'>('bfs');
  const importInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeEntry) {
      const isMulti = !!activeEntry.multiResults || isMultiAlgorithmResult(activeEntry.simResult as unknown) || String(activeEntry.algorithm).toLowerCase().includes('multi');
      setRobotAlgo(isMulti ? 'bfs' : activeEntry.algorithm as 'bfs'|'dfs'|'hybrid');
    }
  }, [activeEntry]);

  // ── Auto-generate a smart export filename ───────────────────────────────
  const buildExportFilename = (entries: HistoryEntry[]): string => {
    const scenarioSlug = scenario ?? entries[0]?.scenario ?? 'simulation';
    const algoSlug = 'multi-alg';
    const dateSlug = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `${algoSlug}-${scenarioSlug}-${dateSlug}.json`;
  };

  // ── Export selected (or all) entries as a JSON file ─────────────────────
  const handleExport = () => {
    const toExport = selectedIds.size > 0
      ? filteredHistory.filter(e => selectedIds.has(e.id))
      : filteredHistory;
    if (toExport.length === 0) return;
    const blob = new Blob([JSON.stringify(toExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = buildExportFilename(toExport);
    link.click();
    URL.revokeObjectURL(url);
  };

  // ── Import entries from a JSON file ─────────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const entries: HistoryEntry[] = (Array.isArray(parsed) ? parsed : [parsed]).map(entry => ({
          ...entry,
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          // Re-stamp with a new unique id to avoid collisions
          id: entry.id ?? Date.now().toString() + Math.random().toString(36).slice(2),
        }));
        if (entries.length > 0) {
          onImportHistory(entries);
          alert(`✅ Imported ${entries.length} record(s) successfully.`);
        }
      } catch {
        alert('❌ Invalid file format. Please select a valid history JSON file.');
      }
      // Reset so the same file can be re-imported
      if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!isOpen) { 
      setView('list'); 
      setActiveEntry(null); 
      setSelectedIds(new Set()); 
      setIsPurgeModalOpen(false);
      setHighlightedNodeId(null);
    }
  }, [isOpen]);

  const filteredHistory = useMemo(() => {
    if (!scenario) return history;
    return history.filter(h => h.scenario === scenario);
  }, [history, scenario]);

  if (!isOpen) return null;

  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    onDeleteHistory(Array.from(selectedIds));
    setSelectedIds(new Set());
    setIsPurgeModalOpen(false);
  };

  const handleOpenDetail = (entry: HistoryEntry) => {
    setHighlightedNodeId(null);
    setActiveEntry(entry);
    setView('detail');
  };

  const renderDetailView = (entry: HistoryEntry) => {
    const results = getEntryResults(entry);
    
    const getData = (algo: 'bfs' | 'dfs' | 'hybrid') => {
      const res = results[algo];
      if (!res) return null;
      const metrics = res.metrics || res;
      if (metrics.totalLatency === undefined && metrics.pathLength === undefined) return null;

      const actualDistance = Math.max(metrics.pathLength || 0, 0);
      const cRate = metrics.completionRate !== undefined ? `${metrics.completionRate.toFixed(1)}%` : '0%';
      
      return {
        time: metrics.timeElapsed || 0,
        nodes: metrics.nodesExplored || 0,
        distance: actualDistance,
        memory: getMemoryInMB(metrics.memoryUsed || 0),
        optimality: extractPrimitive(getPathOptimality(actualDistance, entry.optimalPathLength || 0)),
        completion: cRate,
        adaptability: extractPrimitive(getAdaptabilityScore('done', metrics, algo, res.dynamicEvents || [])),
        success: metrics.exitFound || false,
        reason: metrics.failureReason
      };
    };

    const bfs = getData('bfs');
    const dfs = getData('dfs');
    const hyb = getData('hybrid');

    const renderCell = (value: string | number, color: string, isFailure: boolean = false) => (
      <td className={`py-3 text-center text-xs font-mono font-bold ${isFailure ? 'text-red-500 bg-red-950/10' : 'text-gray-200'}`} style={!isFailure ? { color } : {}}>
        {isFailure ? 'CRITICAL FAILURE' : value}
      </td>
    );

    const baseGraph = results.hybrid?.graph || results.bfs?.graph || results.dfs?.graph || entry.simResult?.graph;
    const allEvents = results.hybrid?.dynamicEvents || results.bfs?.dynamicEvents || results.dfs?.dynamicEvents || entry.simResult?.dynamicEvents || [];
    const blockedNodeIds = new Set<string>();
    allEvents.forEach(e => { if (e.blocked) blockedNodeIds.add(e.nodeId); });
    const maxEventStep = allEvents.length > 0 ? Math.max(...allEvents.map(e => e.stepIndex)) : 0;
    const maxSteps = Math.max(
      results.bfs?.steps?.length || 0,
      results.dfs?.steps?.length || 0,
      results.hybrid?.steps?.length || 0,
      entry.simResult?.steps?.length || 0
    );

    // Build shelfBoxCounts for AWS warehouse box visualization.
    // For packing desks: set capacity to 6 (the renderer uses this as requiredCount
    // and compares algo.delivered from step data against it to show filled/empty cells).
    const shelfBoxCounts = (() => {
      const counts = new Map<string, number>();
      if (entry.scenario !== 'robotics' || !baseGraph) return counts;
      
      const allDestIds = baseGraph.destinationIds || [];
      allDestIds.forEach(nodeId => {
        counts.set(nodeId, 6); // Always 6 boxes capacity per destination
      });
      
      return counts;
    })();
    type AlgoData = NonNullable<ReturnType<typeof getData>>;
    const algoEntries: { key: AlgorithmKey; label: string; color: string; data: AlgoData }[] = [
      ...(bfs && bfs.success ? [{ key: 'bfs' as AlgorithmKey, label: 'BFS', color: '#4ade80', data: bfs }] : []),
      ...(dfs && dfs.success ? [{ key: 'dfs' as AlgorithmKey, label: 'DFS', color: '#c084fc', data: dfs }] : []),
      ...(hyb && hyb.success ? [{ key: 'hybrid' as AlgorithmKey, label: 'Hybrid', color: '#fb923c', data: hyb }] : []),
    ];

    const computeScore = (d: AlgoData) => {
      const maxTime = Math.max(bfs?.time || 0, dfs?.time || 0, hyb?.time || 0, 0.001);
      const maxDist = Math.max(bfs?.distance || 0, dfs?.distance || 0, hyb?.distance || 0, 1);
      const maxMem  = Math.max(bfs?.nodes || 0, dfs?.nodes || 0, hyb?.nodes || 0, 1);
      const speedScore  = 1 - d.time / maxTime;
      const distScore   = 1 - d.distance / maxDist;
      const memScore    = 1 - d.nodes / maxMem;
      const adaptScore  = (Number(d.adaptability) || 0) / 100;
      return (speedScore * 0.25) + (distScore * 0.35) + (memScore * 0.20) + (adaptScore * 0.20);
    };

    const scoredAlgos = algoEntries.map(a => ({ ...a, score: computeScore(a.data) }))
      .sort((a, b) => b.score - a.score);

    const winner = scoredAlgos[0] ?? null;
    const runnerUp = scoredAlgos[1] ?? null;

    const MOVEMENT_PROFILES: Record<AlgorithmKey, { motion: string; strategy: string; tradeoff: string; icon: string }> = {
      bfs: {
        icon: '🌊',
        motion: 'Wave-front expansion — visits all neighbors at depth N before advancing to depth N+1',
        strategy: 'Each step moves laterally across the graph width, building a complete "ring" around the source before proceeding deeper. On a map, this looks like a growing flood-fill.',
        tradeoff: 'Guarantees shortest path in hops but explores more nodes and uses more memory than DFS on sparse graphs.',
      },
      dfs: {
        icon: '🎯',
        motion: 'Deep plunge — follows one branch as far as possible, then backtracks to try the next',
        strategy: 'Each step dives down a single chain of nodes, committing fully to one route before reconsidering. On a map, this looks like a single probe shooting forward.',
        tradeoff: 'Uses minimal memory and is fast to reach deep nodes, but may miss shorter paths and must backtrack fully when blocked.',
      },
      hybrid: {
        icon: '⚡',
        motion: 'Adaptive switching — applies BFS at high-branching junctions and DFS in low-branching corridors',
        strategy: 'Each step evaluates the local branching factor. At hubs (many neighbors) it broadcasts like BFS; in corridors (few neighbors) it dives like DFS. This produces an optimal coverage pattern.',
        tradeoff: 'Balances speed and coverage — faster than pure BFS on deep paths, shorter than pure DFS on wide graphs. Superior for dynamic maps where routes change.',
      },
    };

    const BarRow = ({ label, bfsVal, dfsVal, hybVal, unit = '', lowerBetter = true }: {
      label: string; bfsVal: number; dfsVal: number; hybVal: number; unit?: string; lowerBetter?: boolean;
    }) => {
      const values = [bfsVal, dfsVal, hybVal].filter(v => v > 0);
      const maxVal = Math.max(...values, 0.001);
      const toW = (v: number) => `${Math.min(100, (v / maxVal) * 100).toFixed(1)}%`;
      const isBest = (v: number) => lowerBetter
        ? values.length > 0 && v === Math.min(...values)
        : values.length > 0 && v === Math.max(...values);
      return (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500 uppercase tracking-wide font-semibold">{label}</span>
          </div>
          {[
            { key: 'BFS', val: bfsVal, color: '#4ade80', bg: 'bg-green-500' },
            { key: 'DFS', val: dfsVal, color: '#c084fc', bg: 'bg-purple-500' },
            { key: 'HYB', val: hybVal, color: '#fb923c', bg: 'bg-orange-500' },
          ].map(({ key, val, color, bg }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] font-mono w-7 shrink-0" style={{ color }}>{key}</span>
              <div className="flex-1 bg-gray-800/60 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${bg} ${isBest(val) ? 'ring-1 ring-white/30' : 'opacity-70'}`}
                  style={{ width: val > 0 ? toW(val) : '2%' }}
                />
              </div>
              <span className={`text-[10px] font-mono w-16 text-right shrink-0 ${isBest(val) ? 'text-white font-bold' : 'text-gray-500'}`}>
                {val > 0 ? `${val % 1 !== 0 ? val.toFixed(2) : val}${unit}` : 'N/A'}
                {isBest(val) && <span className="ml-0.5 text-yellow-400">★</span>}
              </span>
            </div>
          ))}
        </div>
      );
    };

    const renderSimulationConfig = () => {
      const meta = entry.metadata;
      if (!meta) return (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-5 mb-5 shadow-inner">
          <span className="text-gray-500 text-xs font-mono">No simulation configuration data available for this run.</span>
        </div>
      );

      const resolvedMapId = meta.mapId || (baseGraph?.nodes.some(n => n.id.includes('boys') || n.id.includes('girls') || n.label?.includes('PC-PT')) 
        ? 'campus' 
        : baseGraph?.nodes.some(n => n.id.toLowerCase().includes('finance') || n.id.toLowerCase().includes('sales')) 
          ? 'companybusiness' 
          : baseGraph?.nodes.some(n => n.id.includes('exit_south_main') || n.id.includes('stair_main_') || n.id.includes('l1_spine') || n.id.includes('elev_n_'))
            ? 'synthetic'
            : baseGraph?.nodes.some(n => n.id.includes('lv_hapchan') || n.id.includes('s_bacolod') || n.id.includes('th_w') || n.label?.includes('Kuya J'))
              ? 'city'
              : baseGraph?.nodes.some(n => n.buildingId === 'GL' || n.id.toLowerCase().includes('supermarket') || n.id.toLowerCase().includes('atrium') || n.id.toLowerCase().includes('dept_store'))
                ? 'building'
                : baseGraph?.nodes.some(n => n.label?.includes('nurse') || n.label?.includes('air_pressure') || n.buildingId === 'L1' || n.buildingId === 'clinic')
                  ? 'clinic'
                  : baseGraph?.nodes.some(n => n.id.includes('shelf_f') || n.id.includes('dest_desk_a') || n.id.includes('shelf_m'))
                    ? 'awsWarehouse'
                    : 'synthetic');

      const isBoxDelivery = resolvedMapId?.toLowerCase().includes('aws') || resolvedMapId?.toLowerCase().includes('synthetic');

      const getEvacuationMapName = (id: any) => {
        if (!id || typeof id !== 'string') return String(id || 'Unknown');
        if (id === 'city') return 'Ayala Malls Solenad Nuvali (Atrium)';
        if (id === 'building') return 'SM City Santa Rosa';
        return id.replace(/_/g, ' ');
      };
      
      const getNodeLabelSafe = (id: any) => {
        if (!id || typeof id !== 'string') return String(id || 'Unknown');
        if (!baseGraph) return id;
        const node = baseGraph.nodes.find(n => n.id === id);
        return node?.label || id;
      };

      const safeReplace = (val: any) => {
        if (!val || typeof val !== 'string') return String(val || 'N/A');
        return val.replace(/_/g, ' ').replace(/-/g, ' ');
      };

      // Guaranteed safe array of robots
      const robots = Array.isArray(meta.robotAssignments) ? meta.robotAssignments : [];
      const hasRobots = entry.scenario === 'robotics' && robots.length > 0;
      
      const hasConfig = meta.mapId || 
                        entry.scenario === 'network' || 
                        hasRobots || 
                        entry.scenario === 'evacuation' || 
                        entry.scenario === 'gameai';

      if (!hasConfig) return null;

      return (
        <div className="bg-[#0a0f1e] border border-blue-900/50 rounded-xl p-5 mb-5 shadow-lg w-full">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-800 pb-3">
            <span className="text-blue-400">⚙️</span>
            <span className="font-bold text-gray-200 uppercase text-[11px] tracking-[0.15em]">Simulation Configuration</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-[11px] w-full">
            {meta.mapId && (
              <div className="flex flex-col gap-1.5 w-full">
                <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Map Selection</span>
                <span className="text-white font-medium capitalize bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-md w-full break-words">
                  {entry.scenario === 'evacuation' ? getEvacuationMapName(meta.mapId) : safeReplace(meta.mapId)}
                </span>
              </div>
            )}
            
            {entry.scenario === 'network' && (
              <>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Routing Mode</span>
                  <span className="text-cyan-300 font-medium capitalize bg-cyan-950/40 border border-cyan-900 px-3 py-1.5 rounded-md w-full break-words">
                    {safeReplace(meta.networkRoutingMode)}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Source Device</span>
                  <span className="text-blue-400 font-mono bg-blue-950/40 border border-blue-900 px-3 py-1.5 rounded-md w-full break-words">
                    {getNodeLabelSafe(meta.sourceDevice)}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Destinations</span>
                  <div className="text-indigo-300 font-mono bg-indigo-950/40 border border-indigo-900 px-3 py-1.5 rounded-md w-full max-h-[80px] overflow-y-auto break-words" style={{ scrollbarWidth: 'thin' }}>
                    {Array.isArray(meta.destinationDevices) 
                      ? meta.destinationDevices.map((d: any) => getNodeLabelSafe(d)).join(', ') 
                      : 'N/A'}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Delivery Style</span>
                  <span className="text-purple-300 font-medium capitalize bg-purple-950/40 border border-purple-900 px-3 py-1.5 rounded-md w-full break-words">
                    {meta.deliveryMode || 'N/A'}
                  </span>
                </div>
              </>
            )}

            {hasRobots && (
              <>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Active Robots</span>
                  <span className="text-orange-300 font-medium bg-orange-950/40 border border-orange-900 px-3 py-1.5 rounded-md w-full">
                    {robots.length} Units
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">{isBoxDelivery ? 'Total Payload' : 'Total Destinations'}</span>
                  <span className="text-green-300 font-medium bg-green-950/40 border border-green-900 px-3 py-1.5 rounded-md w-full">
                    {isBoxDelivery 
                      ? robots.reduce((acc: number, r: any) => acc + (r.destinations?.reduce((sum: number, d: string) => sum + (r.boxCounts?.[d] || 6), 0) || 0), 0) + ' Boxes'
                      : robots.reduce((acc: number, r: any) => acc + (r.destinations?.length || 0), 0) + ' Targets'
                    }
                  </span>
                </div>
                
                <div className="col-span-2 md:col-span-4 mt-4 bg-gray-950/50 border border-gray-800 rounded-lg p-4 w-full">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <h3 className="font-bold text-gray-200 uppercase tracking-widest text-[11px]">
                          Robot Fleet Status
                        </h3>
                      </div>
                      
                      {(!!entry.multiResults || isMultiAlgorithmResult(entry.simResult as unknown) || String(entry.algorithm).toLowerCase().includes('multi')) && (
                        <div className="flex bg-gray-900 border border-gray-700 rounded overflow-hidden shadow-inner">
                          {(['bfs', 'dfs', 'hybrid'] as const).map(algo => (
                            <button
                              key={algo}
                              onClick={() => setRobotAlgo(algo)}
                              className={`px-3 py-1 text-[9px] font-bold uppercase transition-colors ${
                                robotAlgo === algo 
                                  ? algo === 'bfs' ? 'bg-green-600 text-white' : algo === 'dfs' ? 'bg-purple-600 text-white' : 'bg-orange-600 text-white'
                                  : 'text-gray-500 hover:bg-gray-800 hover:text-gray-300'
                              }`}
                            >
                              {algo}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-1 rounded border border-gray-800 hidden sm:block">Status: ALL DELIVERIES COMPLETED</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {robots.map((r: any, i: number) => {
                      const robotTotalCount = isBoxDelivery 
                        ? (r.destinations?.reduce((sum: number, d: string) => sum + (r.boxCounts?.[d] || 6), 0) || 0)
                        : (r.destinations?.length || 0);

                      const borderColor = robotAlgo === 'bfs' ? 'border-green-900/40' : robotAlgo === 'dfs' ? 'border-purple-900/40' : 'border-orange-900/40';
                      const textColor = robotAlgo === 'bfs' ? 'text-green-400' : robotAlgo === 'dfs' ? 'text-purple-400' : 'text-orange-400';
                      const barColor = robotAlgo === 'bfs' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' :
                                       robotAlgo === 'dfs' ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)]' :
                                       'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
                      const rBadgeColor = robotAlgo === 'bfs' ? 'bg-green-600' : robotAlgo === 'dfs' ? 'bg-purple-600' : 'bg-orange-600';

                      return (
                        <div key={i} className={`flex flex-col bg-[#0d1326] p-3 rounded-lg border ${borderColor}`}>
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2 font-bold">
                              <span className={`text-white px-2 py-0.5 rounded text-[10px] ${rBadgeColor}`}>R{i+1}</span>
                              <span className="text-blue-200 text-xs">{getNodeLabelSafe(r.robotId)}</span>
                            </div>
                            <div className="flex flex-col items-end">
                              <span className={`${textColor} font-bold text-[10px]`}>COMPLETED</span>
                              <span className="text-gray-500 text-[9px] font-mono">{robotTotalCount}/{robotTotalCount} {isBoxDelivery ? 'Boxes' : 'Targets'}</span>
                            </div>
                          </div>
                          
                          <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden mb-3">
                            <div className={`h-full w-full ${barColor}`}></div>
                          </div>

                          <div className="flex flex-col gap-1.5 w-full text-[10px]">
                            {r.priorityDest && (
                              <div className="flex justify-between items-center bg-blue-950/50 p-2 rounded border border-blue-900/50">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-pink-400 text-[11px]">🎯 Priority:</span>
                                  <span className="text-gray-200 font-medium">{getNodeLabelSafe(r.priorityDest)}</span>
                                </div>
                                <span className={textColor}>✅ Done</span>
                              </div>
                            )}
                            
                            {r.destinations?.length > 0 && (
                              <div className="bg-gray-900/60 p-2 rounded border border-gray-800 flex flex-col gap-1.5 max-h-[100px] overflow-y-auto w-full" style={{ scrollbarWidth: 'thin' }}>
                                <span className="text-gray-500 uppercase tracking-widest text-[8px] font-bold mb-0.5">Assigned Deliveries</span>
                                {r.destinations.map((d: string, j: number) => {
                                  const bCount = r.boxCounts?.[d] || 6;
                                  return (
                                    <div key={j} className="flex justify-between items-center">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`${textColor} text-[10px]`}>✅</span>
                                        <span className="text-gray-300 font-medium truncate max-w-[140px]">{getNodeLabelSafe(d)}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {isBoxDelivery ? (
                                          <span className="text-gray-400 font-mono text-[9px]">{bCount}/{bCount}</span>
                                        ) : (
                                          <span className={`${textColor} opacity-80 text-[9px] font-mono`}>Reached</span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {entry.scenario === 'evacuation' && meta.evacuationSourceId && (
              <div className="flex flex-col gap-1.5 w-full">
                <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Starting Point (Fire Origin)</span>
                <span className="text-red-300 font-medium bg-red-950/40 border border-red-900 px-3 py-1.5 rounded-md w-full truncate">
                  {getNodeLabelSafe(meta.evacuationSourceId)}
                </span>
              </div>
            )}

            {entry.scenario === 'gameai' && meta.gameBoard && (
              <div className="flex flex-col gap-1.5 w-full">
                <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Board Game</span>
                <span className="text-purple-300 font-medium capitalize bg-purple-950/40 border border-purple-900 px-3 py-1.5 rounded-md w-full truncate">
                  {safeReplace(meta.gameBoard)}
                </span>
              </div>
            )}

            {meta.mapId === 'synthetic' && meta.syntheticSizing && (
              <>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Synthetic Nodes</span>
                  <span className="text-yellow-300 font-medium bg-yellow-950/40 border border-yellow-900 px-3 py-1.5 rounded-md w-full">
                    {meta.syntheticSizing.nodes || 0}
                  </span>
                </div>
                <div className="flex flex-col gap-1.5 w-full">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Synthetic Edges</span>
                  <span className="text-yellow-300 font-medium bg-yellow-950/40 border border-yellow-900 px-3 py-1.5 rounded-md w-full">
                    {meta.syntheticSizing.edges || 0}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col gap-5 p-2 h-full overflow-y-auto max-h-[75vh] pr-1">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-2 flex flex-col">
            <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 shadow-2xl mb-5">
              <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
              <h3 className="font-bold text-xs uppercase tracking-widest text-blue-400">🏆 Execution Benchmarks</h3>
              <span className="text-[10px] font-mono text-gray-500">RUN #{entry.runNumber || 'N/A'}</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="py-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Metric</th>
                  <th className="py-2 text-center text-xs text-green-400 font-mono font-bold bg-green-500/5">BFS</th>
                  <th className="py-2 text-center text-xs text-purple-400 font-mono font-bold bg-purple-500/5">DFS</th>
                  <th className="py-2 text-center text-xs text-orange-400 font-mono font-bold bg-orange-500/5">HYB</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                <tr>
                  <td className="py-2.5 text-xs text-gray-400">Exec Time</td>
                  {renderCell(bfs ? `${bfs.time.toFixed(2)} ms` : 'N/A', '#4ade80', bfs !== null && !bfs.success)}
                  {renderCell(dfs ? `${dfs.time.toFixed(2)} ms` : 'N/A', '#c084fc', dfs !== null && !dfs.success)}
                  {renderCell(hyb ? `${hyb.time.toFixed(2)} ms` : 'N/A', '#fb923c', hyb !== null && !hyb.success)}
                </tr>
                <tr>
                  <td className="py-2.5 text-xs text-gray-400">Distance</td>
                  {renderCell(bfs ? bfs.distance.toFixed(1) : 'N/A', '#cbd5e1', bfs !== null && !bfs.success)}
                  {renderCell(dfs ? dfs.distance.toFixed(1) : 'N/A', '#cbd5e1', dfs !== null && !dfs.success)}
                  {renderCell(hyb ? hyb.distance.toFixed(1) : 'N/A', '#cbd5e1', hyb !== null && !hyb.success)}
                </tr>
                <tr>
                  <td className="py-2.5 text-xs text-gray-400">Nodes Swept</td>
                  {renderCell(bfs ? bfs.nodes : 'N/A', '#94a3b8', bfs !== null && !bfs.success)}
                  {renderCell(dfs ? dfs.nodes : 'N/A', '#94a3b8', dfs !== null && !dfs.success)}
                  {renderCell(hyb ? hyb.nodes : 'N/A', '#94a3b8', hyb !== null && !hyb.success)}
                </tr>
                <tr>
                  <td className="py-2.5 text-xs text-gray-400">Memory</td>
                  {renderCell(bfs ? bfs.memory : 'N/A', '#cbd5e1', bfs !== null && !bfs.success)}
                  {renderCell(dfs ? dfs.memory : 'N/A', '#cbd5e1', dfs !== null && !dfs.success)}
                  {renderCell(hyb ? hyb.memory : 'N/A', '#cbd5e1', hyb !== null && !hyb.success)}
                </tr>
                <tr>
                  <td className="py-2.5 text-xs text-gray-400">Path Optimality</td>
                  {renderCell(bfs ? bfs.optimality : 'N/A', '#4ade80', bfs !== null && !bfs.success)}
                  {renderCell(dfs ? dfs.optimality : 'N/A', '#ef4444', dfs !== null && !dfs.success)}
                  {renderCell(hyb ? hyb.optimality : 'N/A', '#fb923c', hyb !== null && !hyb.success)}
                </tr>
                <tr>
                  <td className="py-2.5 text-xs text-gray-400">Adaptability</td>
                  {renderCell(bfs ? `${bfs.adaptability}/100` : 'N/A', '#cbd5e1', bfs !== null && !bfs.success)}
                  {renderCell(dfs ? `${dfs.adaptability}/100` : 'N/A', '#cbd5e1', dfs !== null && !dfs.success)}
                  {renderCell(hyb ? `${hyb.adaptability}/100` : 'N/A', '#fb923c', hyb !== null && !hyb.success)}
                </tr>
                <tr className="bg-gray-950/20">
                  <td className="py-2.5 text-xs text-gray-400 font-semibold">Completion</td>
                  {renderCell(bfs ? bfs.completion : 'N/A', '#4ade80', bfs !== null && !bfs.success)}
                  {renderCell(dfs ? dfs.completion : 'N/A', '#c084fc', dfs !== null && !dfs.success)}
                  {renderCell(hyb ? hyb.completion : 'N/A', '#fb923c', hyb !== null && !hyb.success)}
                </tr>
              </tbody>
            </table>
            {(bfs !== null && !bfs.success || dfs !== null && !dfs.success || hyb !== null && !hyb.success) && (
              <div className="mt-3 p-2 bg-red-900/20 border border-red-500/30 rounded text-xs text-red-300 leading-snug">
                <span className="font-bold uppercase tracking-wider text-[10px]">Failure Reason:</span> {bfs?.reason || dfs?.reason || hyb?.reason || 'Target unreachable'}
              </div>
            )}
          </div>
          </div>
          <div className="xl:col-span-3 h-[340px] xl:h-[340px] w-full bg-[#0a0f1e] rounded-xl border border-gray-800 overflow-hidden shadow-inner relative flex flex-col">
            {baseGraph && (
              <NetworkCanvas
                graph={baseGraph}
                activeSteps={{
                  bfs: results.bfs?.steps?.length ? results.bfs.steps[results.bfs.steps.length - 1] : null,
                  dfs: results.dfs?.steps?.length ? results.dfs.steps[results.dfs.steps.length - 1] : null,
                  hybrid: results.hybrid?.steps?.length ? results.hybrid.steps[results.hybrid.steps.length - 1] : null
                }}
                scenario={entry.scenario}
                stepIndex={maxEventStep > 0 ? maxEventStep : maxSteps}
                dynamicEvents={allEvents}
                historicalBlockedNodeIds={blockedNodeIds}
                highlightedNodeId={highlightedNodeId}
                onDeselect={() => setHighlightedNodeId(null)}
                autoFit={true}
                shelfBoxCounts={shelfBoxCounts}
                disableSimultaneousMode={true}
                mapId={
                  entry.metadata?.mapId || (baseGraph.nodes.some(n => n.id.includes('boys') || n.id.includes('girls') || n.label?.includes('PC-PT')) 
                    ? 'campus' 
                    : baseGraph.nodes.some(n => n.id.toLowerCase().includes('finance') || n.id.toLowerCase().includes('sales')) 
                      ? 'companybusiness' 
                      : baseGraph.nodes.some(n => n.id.includes('exit_south_main') || n.id.includes('stair_main_') || n.id.includes('l1_spine') || n.id.includes('elev_n_'))
                        ? 'synthetic'
                        : baseGraph.nodes.some(n => n.id.includes('lv_hapchan') || n.id.includes('s_bacolod') || n.id.includes('th_w') || n.label?.includes('Kuya J'))
                          ? 'city'
                          : baseGraph.nodes.some(n => n.buildingId === 'GL' || n.id.toLowerCase().includes('supermarket') || n.id.toLowerCase().includes('atrium') || n.id.toLowerCase().includes('dept_store'))
                            ? 'building'
                            : baseGraph.nodes.some(n => n.label?.includes('nurse') || n.label?.includes('air_pressure') || n.buildingId === 'L1' || n.buildingId === 'clinic')
                              ? 'clinic'
                              : baseGraph.nodes.some(n => n.id.includes('shelf_f') || n.id.includes('dest_desk_a') || n.id.includes('shelf_m'))
                                ? 'awsWarehouse'
                                : 'synthetic')
                }
                robotAssignments={
                  entry.metadata?.robotAssignments || baseGraph.nodes.filter(n => n.type === 'depot').map(d => ({
                    robotId: d.id,
                    destinations: baseGraph.nodes.filter(n => n.id.startsWith('dest_') || n.type === 'shelf').map(n => n.id),
                    boxCounts: baseGraph.nodes.filter(n => n.id.startsWith('dest_') || n.type === 'shelf').reduce((acc, n) => ({ ...acc, [n.id]: 6 }), {})
                  }))
                }
              />
            )}
          </div>
          
          {entry.scenario === 'network' && baseGraph?.nodes.some(n => n.id.includes('boys') || n.label?.includes('PC-PT')) && (
            <div className="xl:col-span-5 bg-gray-900/60 border border-indigo-900/50 rounded-xl p-4 flex flex-col gap-2 mt-[-10px]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-1">
                Campus Topology Rules Context
              </div>
              <div className="text-[11px] text-gray-300 space-y-2 leading-relaxed">
                <div>
                  <p className="text-gray-100 font-semibold mb-0.5">1. Routed Traffic with ACLs</p>
                  <ul className="list-disc pl-5 space-y-0.5 text-gray-400">
                    <li>Boys Block can ONLY communicate with AB1.</li>
                    <li>Girls Block can ONLY communicate with AB2.</li>
                    <li>Packets to unauthorized zones are dropped at routers.</li>
                  </ul>
                </div>
                <div className="pt-2 border-t border-gray-800">
                  <p className="text-gray-100 font-semibold mb-0.5">2. Local Switched Traffic</p>
                  <p className="text-gray-400">Yellow Zone shares a single subnet. Traffic flows freely via Layer 2 switching, bypassing ACLs.</p>
                </div>
              </div>
            </div>
          )}
        </div>
        {winner ? (
          <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-950/30 via-amber-950/20 to-gray-900/40 p-4 shadow-lg shadow-yellow-900/10">
            <div className="flex items-start gap-4">
              <div className="text-3xl shrink-0 mt-0.5">🥇</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-sm font-bold text-yellow-300 uppercase tracking-widest">Best Algorithm for this Map</h3>
                  <span
                    className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border"
                    style={{ color: winner.color, borderColor: `${winner.color}50`, background: `${winner.color}15` }}
                  >
                    {winner.label}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">Score: {(winner.score * 100).toFixed(1)}/100</span>
                </div>
                <p className="text-xs text-gray-300 leading-relaxed mb-2">
                  <span className="text-yellow-400 font-semibold mr-1">{MOVEMENT_PROFILES[winner.key].icon} Movement:</span>
                  {MOVEMENT_PROFILES[winner.key].motion}
                </p>
                <p className="text-[11px] text-gray-400 leading-relaxed mb-2">
                  {MOVEMENT_PROFILES[winner.key].strategy}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {winner.data.distance <= Math.min(bfs?.distance ?? Infinity, dfs?.distance ?? Infinity, hyb?.distance ?? Infinity) && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/60 border border-blue-700/40 text-blue-300">📏 Shortest Path</span>
                  )}
                  {winner.data.time <= Math.min(bfs?.time ?? Infinity, dfs?.time ?? Infinity, hyb?.time ?? Infinity) && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-green-950/60 border border-green-700/40 text-green-300">⚡ Fastest Execution</span>
                  )}
                  {winner.data.nodes <= Math.min(bfs?.nodes ?? Infinity, dfs?.nodes ?? Infinity, hyb?.nodes ?? Infinity) && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-700/40 text-purple-300">🔍 Least Nodes Swept</span>
                  )}
                  {Number(winner.data.adaptability) >= Math.max(Number(bfs?.adaptability ?? 0), Number(dfs?.adaptability ?? 0), Number(hyb?.adaptability ?? 0)) && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-orange-950/60 border border-orange-700/40 text-orange-300">🛡️ Highest Adaptability</span>
                  )}
                </div>
                {runnerUp && (
                  <p className="text-[10px] text-gray-500 mt-2 border-t border-gray-800/50 pt-2">
                    Runner-up: <span className="font-semibold" style={{ color: runnerUp.color }}>{runnerUp.label}</span> — {MOVEMENT_PROFILES[runnerUp.key].tradeoff}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-xs text-red-400 text-center">
            ⚠️ No algorithm completed successfully on this run — all paths were exhausted or severed.
          </div>
        )}
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 pb-2 border-b border-gray-800">
            🧭 How Each Algorithm Moves Node-to-Node
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {(
              [
                { key: 'bfs' as AlgorithmKey, label: 'BFS', color: '#4ade80', result: bfs },
                { key: 'dfs' as AlgorithmKey, label: 'DFS', color: '#c084fc', result: dfs },
                { key: 'hybrid' as AlgorithmKey, label: 'Hybrid BFS-DFS', color: '#fb923c', result: hyb },
              ] as const
            ).map(({ key, label, color, result }) => {
              const profile = MOVEMENT_PROFILES[key];
              const isWinner = winner?.key === key;
              return (
                <div
                  key={key}
                  className={`rounded-lg border p-3 relative ${isWinner ? 'border-yellow-500/40 bg-yellow-950/10' : 'border-gray-800 bg-gray-900/30'}`}
                >
                  {isWinner && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold text-yellow-400 bg-yellow-950/60 border border-yellow-700/40 px-1.5 py-0.5 rounded">
                      BEST ★
                    </span>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{profile.icon}</span>
                    <span className="text-xs font-bold" style={{ color }}>{label}</span>
                    {result && !result.success && (
                      <span className="text-[9px] text-red-400 border border-red-800/40 px-1 rounded ml-auto">FAILED</span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-300 leading-relaxed font-semibold mb-1">{profile.motion}</p>
                  <p className="text-[10px] text-gray-500 leading-relaxed">{profile.tradeoff}</p>
                  {result && result.success && (
                    <div className="mt-2 pt-2 border-t border-gray-800/40 grid grid-cols-2 gap-1 text-[10px] font-mono">
                      <span className="text-gray-600">Hops:</span>
                      <span className="text-right" style={{ color }}>{result.distance}</span>
                      <span className="text-gray-600">Nodes:</span>
                      <span className="text-right" style={{ color }}>{result.nodes}</span>
                      <span className="text-gray-600">Time:</span>
                      <span className="text-right" style={{ color }}>{result.time.toFixed(2)} ms</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 pb-2 border-b border-gray-800">
            📊 Performance Breakdown — Visual Comparison
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <BarRow
              label="Execution Time (lower ★ = better)"
              bfsVal={bfs?.time ?? 0} dfsVal={dfs?.time ?? 0} hybVal={hyb?.time ?? 0}
              unit=" ms" lowerBetter={true}
            />
            <BarRow
              label="Path Distance — Hops (lower ★ = better)"
              bfsVal={bfs?.distance ?? 0} dfsVal={dfs?.distance ?? 0} hybVal={hyb?.distance ?? 0}
              lowerBetter={true}
            />
            <BarRow
              label="Nodes Swept / Explored (lower ★ = better)"
              bfsVal={bfs?.nodes ?? 0} dfsVal={dfs?.nodes ?? 0} hybVal={hyb?.nodes ?? 0}
              lowerBetter={true}
            />
            <BarRow
              label="Dynamic Adaptability (higher ★ = better)"
              bfsVal={Number(bfs?.adaptability ?? 0)} dfsVal={Number(dfs?.adaptability ?? 0)} hybVal={Number(hyb?.adaptability ?? 0)}
              lowerBetter={false}
            />
            <BarRow
              label="Completion Rate % (higher ★ = better)"
              bfsVal={parseFloat(bfs?.completion ?? '0')} dfsVal={parseFloat(dfs?.completion ?? '0')} hybVal={parseFloat(hyb?.completion ?? '0')}
              lowerBetter={false}
            />
            <BarRow
              label="Memory Used — KB (lower ★ = better)"
              bfsVal={parseFloat(String(bfs?.memory ?? '0'))} dfsVal={parseFloat(String(dfs?.memory ?? '0'))} hybVal={parseFloat(String(hyb?.memory ?? '0'))}
              unit=" KB" lowerBetter={true}
            />
          </div>
        </div>
        
        {renderSimulationConfig()}

        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-xs text-gray-400 space-y-2">
          <span className="font-bold text-gray-300 block uppercase text-[10px] tracking-wider text-orange-400">📌 Structural Metadata</span>
          <p>Graph composed of <strong className="text-white">{entry.totalNodes || 0} total nodes</strong>. Baseline optimal path: <strong className="text-white">{entry.optimalPathLength || 0} distance units</strong>.</p>
          
          {allEvents.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-800/50">
              <span className="font-bold text-orange-400 block text-[10px] uppercase tracking-wider mb-2">⚡ Dynamic Blockages</span>
              <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                {allEvents.map((event, idx) => {
                  const isHighlighted = highlightedNodeId === event.nodeId;
                  return (
                    <div
                      key={idx}
                      onClick={() => setHighlightedNodeId(prev => prev === event.nodeId ? null : event.nodeId)}
                      title="Click to locate on map"
                      className={`flex items-start gap-2 p-2 rounded border cursor-pointer select-none transition-all ${
                        isHighlighted
                          ? 'border-yellow-400 bg-yellow-900/20 shadow-[0_0_8px_rgba(234,179,8,0.35)] scale-[1.01]'
                          : event.blocked
                            ? 'border-orange-500/30 bg-orange-900/10 text-orange-300 hover:border-orange-400/60'
                            : 'border-green-500/30 bg-green-900/10 text-green-300 hover:border-green-400/60'
                      }`}
                    >
                      <span className="font-mono opacity-60 shrink-0">[{event.stepIndex}]</span>
                      <span>{event.blocked ? '🔴' : '🟢'} {event.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {entry.scenario === 'gameai' && (
            <div className="mt-2 pt-2 border-t border-gray-800/50">
              <StrategyMapEvents 
                dynamicEvents={allEvents} 
                stepIndex={maxEventStep > 0 ? maxEventStep : maxSteps} 
                simResults={{
                  bfs: results.bfs as any,
                  dfs: results.dfs as any,
                  hybrid: results.hybrid as any
                }} 
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-[1300px] h-[90vh] flex flex-col overflow-hidden shadow-glow-blue fade-in">
        
        {/* Header Section */}
        <header className="p-5 border-b border-gray-800 bg-[#0a0f1e]/60 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {view === 'list' ? '🗄️ Core Simulation Storage History' : `🔍 Performance Inspect: ${activeEntry?.name}`}
            </h2>
            {view === 'list' && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono">
                {filteredHistory.length} entries
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Import/Export toolbar — only shown in list view */}
            {view === 'list' && (
              <>
                {/* Hidden file input for import */}
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 hover:text-blue-200 border border-blue-700/30 hover:border-blue-600/50 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  title="Import history from a JSON file"
                >
                  📥 Import
                </button>
                <button
                  onClick={() => {
                    if (selectedIds.size === filteredHistory.length) {
                      setSelectedIds(new Set());
                    } else {
                      setSelectedIds(new Set(filteredHistory.map(h => h.id)));
                    }
                  }}
                  disabled={filteredHistory.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedIds.size === filteredHistory.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleExport}
                  disabled={filteredHistory.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-300 hover:text-emerald-200 border border-emerald-700/30 hover:border-emerald-600/50 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected record(s)` : 'Export all records'}
                >
                  📤 {selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export All'}
                </button>
              </>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all">✕</button>
          </div>
        </header>

        {/* Dynamic Action Toolbar for Selection Management */}
        {view === 'list' && selectedIds.size > 0 && (
          <div className="bg-red-950/20 border-b border-red-900/40 px-6 py-3 flex justify-between items-center animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-red-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Flagged <strong className="font-mono bg-red-950 px-1.5 py-0.5 border border-red-800/40 rounded">{selectedIds.size}</strong> records for truncation.
            </div>
            <button 
              onClick={() => setIsPurgeModalOpen(true)}
              className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Purge Target Records
            </button>
          </div>
        )}

        {/* Primary Content Window */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#060b16]">
          {view === 'list' ? (
            filteredHistory.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <span className="text-4xl mb-2">📁</span>
                <h4 className="text-gray-300 font-bold text-sm">No History Indexes Logged</h4>
                <p className="text-gray-500 text-xs mt-1 max-w-xs">Run algorithmic simulation cycles from your network control matrix dashboard to save benchmark logs here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHistory.map(entry => {
                  const isSelected = selectedIds.has(entry.id);
                  const formattedDate = typeof entry.timestamp === 'string' 
                    ? new Date(entry.timestamp).toLocaleString() 
                    : entry.timestamp?.toLocaleString() || 'Unknown Date';

                  return (
                    <div 
                      key={entry.id} 
                      onClick={() => handleOpenDetail(entry)} 
                      className={`group p-4 bg-gray-900/40 hover:bg-gray-900/80 border rounded-xl cursor-pointer transition-all relative flex flex-col justify-between h-36 shadow-lg ${
                        isSelected ? 'border-red-500/50 bg-red-950/5' : 'border-gray-800/80 hover:border-gray-700'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <h3 className="font-bold text-white text-sm tracking-tight truncate max-w-[75%] group-hover:text-blue-400 transition-colors">
                            {entry.name}
                          </h3>
                          <span className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${SCENARIO_BADGES[entry.scenario] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                            {entry.scenario}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-gray-500">{formattedDate}</p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-gray-800/50 mt-auto">
                        <div className="flex items-center gap-3">
                          {/* Selection Checkbox Ring */}
                          <div 
                            onClick={(e) => toggleSelection(entry.id, e)}
                            className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                              isSelected ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-gray-700 group-hover:border-gray-500'
                            }`}
                          >
                            {isSelected && <span className="text-[9px]">✓</span>}
                          </div>
                          <span className="text-[11px] font-mono text-gray-400">
                            Nodes: <strong className="text-gray-200">{entry.totalNodes || entry.simResult?.graph?.nodes?.length || 0}</strong>
                          </span>
                        </div>

                        {/* Inline Delete Button Wrapper */}
                        <button 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setSelectedIds(new Set([entry.id]));
                            setIsPurgeModalOpen(true); 
                          }}
                          className="text-gray-500 hover:text-red-400 opacity-60 group-hover:opacity-100 p-1 text-xs rounded transition-all"
                          title="Delete this record"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            activeEntry && renderDetailView(activeEntry)
          )}
        </div>

        {/* Global Footer Controls */}
        <footer className="p-4 border-t border-gray-800 bg-[#0a0f1e]/40 flex justify-between items-center">
          <div>
            {view === 'detail' && (
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                Viewing Execution Pipeline: <strong className="text-gray-300 font-bold font-sans">{activeEntry?.name}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {view === 'detail' && (
              <button
                onClick={() => { setView('list'); }}
                className="px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
              >
                ← Return to Index
              </button>
            )}
          </div>
        </footer>
      </div>

      {/* Purge Confirmation Modal */}
      {isPurgeModalOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-900 border border-red-500/30 rounded-xl p-6 max-w-sm w-full shadow-2xl scale-in">
            <h3 className="text-red-400 font-bold text-lg mb-2 flex items-center gap-2">
              <span className="text-xl">⚠️</span> Confirm Purge
            </h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-red-400 font-bold">{selectedIds.size}</strong> flagged record(s)? This action cannot be undone and the telemetry data will be lost.
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsPurgeModalOpen(false)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-red-900/20"
              >
                Purge Records
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
