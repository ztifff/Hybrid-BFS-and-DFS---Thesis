import React, { useMemo, useState, useEffect } from 'react';

import { ScenarioType, GameAIBoard } from '../../types';
import { useSimulation } from '../../hooks/useSimulation';
import { getScenario } from '../../config/scenarios';
import { CiscoTerminal } from '../NetworkCanvas/renderers/scenarios/network/CiscoTerminal';
import { MAP_REGISTRY } from '../../config/mapRegistry';

import { NetworkCanvas } from '../../components/NetworkCanvas';
import { MetricsPanel } from './MetricsPanel';
import { Legend } from '../../components/Legend';
import { SimulationReport } from './SimulationReport';
import { HistoryModal } from '../../components/HistoryModal';
import { DynamicMapEvents } from './DynamicMapEvents';
import { StrategyMapEvents } from './StrategyMapEvents';
import { HelpModal } from '../../components/HelpModal';
import { RobotAssignmentPanel } from './RobotAssignmentPanel';
import { RobotLiveStatusPanel } from './RobotLiveStatusPanel';
import { ResizableSidebar } from '../layout/ResizableSidebar';

interface Props {
  scenario: ScenarioType;
  onBack: () => void;
}

const GAME_AI_BOARDS: { id: GameAIBoard; label: string; icon: string }[] = [
  { id: 'dama', label: 'Turkish Draughts', icon: '🔵' },
  { id: 'checkers', label: 'Checkers', icon: '⚫' },
];

const MIN_SYNTHETIC_NODES: Record<ScenarioType, number> = {
  network: 7, //4 links
  robotics: 13, //18 links
  traffic: 9, //4 links
  evacuation: 28, //27 links
  gameai: 17, //24 links
};

const MIN_SYNTHETIC_LINKS: Record<ScenarioType, number> = {
  network: 4,
  robotics: 18,
  traffic: 4,
  evacuation: 27,
  gameai: 24,
};

const MAX_SYNTHETIC_NODES: Record<ScenarioType, number> = {
  network: 220,
  robotics: 217,
  traffic: 220,
  evacuation: 144,
  gameai: 145,
};

function getNextGameAINodes(currentNodes: number, direction: 'up' | 'down', board: GameAIBoard = 'dama'): number {
  if (board === 'dama') {
    const D = Math.round(Math.sqrt(currentNodes - 1));
    const nextD = direction === 'up' ? Math.min(D + 1, 12) : Math.max(D - 1, 4);
    return (nextD * nextD) + 1;
  } else {
    let D = 4;
    while (Math.ceil((D * D) / 2) + 2 <= currentNodes && D <= 12) {
      D++;
    }
    D--; 
    const nextD = direction === 'up' ? Math.min(D + 1, 12) : Math.max(D - 1, 4);
    return Math.ceil((nextD * nextD) / 2) + 2;
  }
}

function getNextRoboticsNodes(currentNodes: number, direction: 'up' | 'down'): number {
  const sizes = [13, 16, 19, 25, 29, 33, 36, 41, 46, 55, 61, 67, 71, 78, 85, 97, 105, 113, 118, 127, 136, 151, 161, 171, 177, 188, 199, 217];
  let currentIndex = sizes.findIndex(s => s >= currentNodes);
  if (currentIndex === -1) currentIndex = sizes.length - 1;
  
  if (direction === 'up') {
    return sizes[Math.min(currentIndex + 1, sizes.length - 1)];
  } else {
    // If the currentNodes is exactly a size, step down. If it's between sizes, stepping down goes to the previous valid size.
    if (sizes[currentIndex] > currentNodes && currentIndex > 0) {
      return sizes[currentIndex - 1];
    }
    return sizes[Math.max(currentIndex - 1, 0)];
  }
}

export const SimulationView: React.FC<Props> = ({ scenario, onBack }) => {
  const sc = getScenario(scenario);

  const sim = useSimulation({ scenario });

  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  // Network routing DST dropdown state
  const [dstDropdownOpen, setDstDropdownOpen] = useState(false);
  const [localNodesInput, setLocalNodesInput] = useState<string>(sim.syntheticSizing.nodes.toString());
  const [localEdgesInput, setLocalEdgesInput] = useState<string>(sim.syntheticSizing.edges.toString());
  const [pendingNavigation, setPendingNavigation] = useState<{type: 'back'} | {type: 'map', mapId: string} | {type: 'gameboard', boardId: GameAIBoard} | null>(null);

  useEffect(() => {
    const actualNodes = sim.currentGraph?.nodes.length ?? sim.syntheticSizing.nodes;
    setLocalNodesInput(actualNodes.toString());
  }, [sim.syntheticSizing.nodes, sim.currentGraph?.nodes.length]);

  useEffect(() => {
    const actualEdges = sim.currentGraph 
      ? Math.floor(sim.currentGraph.edges.filter(e => e.type !== 'wireless').length / 2) 
      : sim.syntheticSizing.edges;
    setLocalEdgesInput(actualEdges.toString());
  }, [sim.syntheticSizing.edges, sim.currentGraph?.edges.length]);

  const handleBack = () => {
    if (sim.status === 'done' && !sim.isCurrentSaved) {
      setPendingNavigation({ type: 'back' });
    } else {
      onBack();
    }
  };

  const handleMapChange = (mapId: string) => {
    if (sim.mapId === mapId) return;
    if (sim.status === 'done' && !sim.isCurrentSaved) {
      setPendingNavigation({ type: 'map', mapId });
    } else {
      sim.setMapId(mapId);
      const mapDef = MAP_REGISTRY[scenario]?.find(m => m.id === mapId);
      if (mapDef?.isRealWorld) sim.setGraphSize('medium');
    }
  };

  const handleBoardChange = (boardId: GameAIBoard) => {
    if (sim.gameBoard === boardId) return;
    if (sim.status === 'done' && !sim.isCurrentSaved) {
      setPendingNavigation({ type: 'gameboard', boardId });
    } else {
      sim.setGameBoard(boardId);
      sim.setMapId('synthetic');
    }
  };

  // Evacuation: is this a real-world map that supports custom start point selection?
  const isEvacuationRealWorld = scenario === 'evacuation' && (sim.mapId === 'city' || sim.mapId === 'building');

  const handleEventClick = (nodeId: string) => {
    setHighlightedNodeId(prev => prev === nodeId ? null : nodeId);
  };

  const scenarioHistoryCount = useMemo(
    () => sim.history.filter((h) => h.scenario === scenario).length,
    [sim.history, scenario]
  );

  // Derive shelf box counts from robot assignments for AWS Warehouse canvas visualization
  const shelfBoxCounts = useMemo(() => {
    if (scenario !== 'robotics' || !sim.robotAssignments?.length) return undefined;
    const map = new Map<string, number>();
    sim.robotAssignments.forEach(a => {
      a.destinations.forEach(destId => {
        const count = a.boxCounts?.[destId] ?? 6;
        // Sum total required boxes across all robots assigned to this destination
        map.set(destId, (map.get(destId) ?? 0) + count);
      });
    });
    return map;
  }, [scenario, sim.robotAssignments]);
  const generatedNodeCount = sim.currentGraph?.nodes.length ?? sim.syntheticSizing.nodes;
  // Divide the edges length by 2 to show the number of physical undirected links (lines) drawn on the canvas,
  // since the backend models every physical link as two bidirectional directed edges (A->B and B->A).
  // We explicitly exclude 'wireless' edges (like capture jumps in Game AI) from this visual count.
  const generatedEdgeCount = sim.currentGraph 
    ? Math.floor(sim.currentGraph.edges.filter(e => e.type !== 'wireless').length / 2) 
    : sim.syntheticSizing.edges;

  return (
    <>
      {pendingNavigation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className="bg-gray-900 border border-amber-500/30 rounded-xl p-6 max-w-sm w-full shadow-2xl scale-in">
            <h3 className="text-amber-400 font-bold text-lg mb-2 flex items-center gap-2">
              <span className="text-xl">⚠️</span> Unsaved Results
            </h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              You have an unsaved simulation result. Are you sure you want to discard it and leave?
            </p>
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setPendingNavigation(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (pendingNavigation.type === 'back') {
                    onBack();
                  } else if (pendingNavigation.type === 'map') {
                    sim.setMapId(pendingNavigation.mapId);
                    const mapDef = MAP_REGISTRY[scenario]?.find(m => m.id === pendingNavigation.mapId);
                    if (mapDef?.isRealWorld) sim.setGraphSize('medium');
                  } else if (pendingNavigation.type === 'gameboard') {
                    sim.setGameBoard(pendingNavigation.boardId);
                    sim.setMapId('synthetic');
                  }
                  setPendingNavigation(null);
                }}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-amber-900/20"
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="min-h-screen lg:h-screen w-full max-w-[100vw] bg-transparent text-white flex flex-col relative z-0 lg:overflow-hidden fade-in">
        {/* Help Modal */}
        {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} scenario={scenario} />}
        <header className="glass-panel border-b-0 border-white/5 px-2 sm:px-3 md:px-6 py-2.5 md:py-3 flex items-center justify-between shrink-0 relative z-10 gap-1.5 sm:gap-2 w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-1.5 sm:gap-4 relative z-10 min-w-0 flex-1">
            <button
              onClick={handleBack}
              className="px-2 sm:px-3 py-2 text-gray-400 hover:text-white flex items-center gap-1 sm:gap-2 transition-all hover:bg-white/5 rounded-lg text-sm font-bold whitespace-nowrap active:scale-95 shrink-0"
            >
              <span className="opacity-70 text-lg">←</span> <span className="hidden sm:inline tracking-wider">Back</span>
            </button>
            <div className="h-6 w-px bg-white/10 hidden sm:block mx-0.5 shrink-0"></div>
            <div className="flex items-center gap-1.5 sm:gap-3 bg-[#0a0f1e]/80 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/10 shadow-inner min-w-0">
              <span className="text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] shrink-0">{sc?.icon}</span>
              <h1 className="font-bold text-xs sm:text-base md:text-lg text-white tracking-widest drop-shadow-md truncate">{sc?.name}</h1>
            </div>

            {/* Algorithm Legend / Indicator */}
            <div className="hidden lg:flex items-center gap-4 ml-4 px-4 py-1.5 bg-black/40 rounded-full border border-white/5 text-[10px] font-bold tracking-widest uppercase shrink-0">
              <span className="text-green-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(74,222,128,0.5)]">
                <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span> BFS
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-purple-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]">
                <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]"></span> DFS
              </span>
              <span className="text-gray-600">|</span>
              <span className="text-orange-400 flex items-center gap-1.5 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]">
                <span className="w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span> Hybrid
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10 ml-auto">
            <button 
              onClick={() => sim.setIsHistoryModalOpen(true)}
              className="px-2.5 sm:px-4 py-1.5 rounded-lg glass-panel text-gray-200 hover:text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] shadow-md hover:shadow-glow-blue hover:border-blue-500/50"
            >
              <span className="hidden sm:inline">Result History</span>
              <span className="sm:hidden text-base">🗄️</span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none min-w-[20px] text-center">
                {scenarioHistoryCount}
              </span>
            </button>
          </div>

          <div className="z-20 shrink-0 ml-2 sm:ml-4 flex items-center">
            <button
              onClick={() => setIsHelpOpen(true)}
              title="Help & Guide"
              className="w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-full md:rounded-lg glass-panel text-gray-200 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]"
              style={{
                borderColor: `${sc?.color}60`,
                boxShadow: `0 0 12px ${sc?.color}20, inset 0 0 8px ${sc?.color}10`,
                textShadow: `0 0 8px ${sc?.color}40`,
              }}
            >
              <span className="md:hidden">{sc?.icon || '?'}</span>
              <span className="hidden md:flex items-center gap-2">
                <span className="text-lg leading-none filter drop-shadow-sm">{sc?.icon || '❓'}</span>
                Help & Guide
              </span>
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row flex-1 lg:min-h-0 overflow-y-auto lg:overflow-hidden">
          <ResizableSidebar
            side="left"
            storageKey="sim_left_panel"
            defaultWidth={320}
            minWidth={260}
            maxWidth={450}
            className="border-b lg:border-b-0 lg:border-r border-gray-800 lg:max-h-[calc(100vh-theme(spacing.20))] bg-[#0a0f1e]/50 backdrop-blur-sm"
            innerClassName="p-4 flex flex-col gap-4"
          >
            {sim.simResults && !sim.isComputing && sim.currentGraph ? (
              <MetricsPanel
                multiResults={sim.simResults}
                activeSteps={sim.activeSteps}
                scenario={scenario}
                status={sim.status}
                stepIndex={sim.stepIndex}
                totalSteps={sim.totalSteps}
                totalNodes={sim.currentGraph.nodes.length}
                optimalPathLength={sim.bfsResult?.pathLength ?? 0}
              />
            ) : (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center py-12 text-center text-gray-400 animate-pulse">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <div>Fetching evaluation matrices from backend...</div>
              </div>
            )}

            <Legend scenario={scenario} mapId={sim.mapId} />
          </ResizableSidebar>

          <main className="flex-1 flex flex-col items-center justify-start p-4 w-full relative lg:overflow-hidden min-h-0">
            <div className="mb-1 flex flex-col items-center gap-1.5 w-full shrink-0">
              <div className="flex items-center gap-2 flex-wrap justify-center text-center">
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-900/20 text-blue-400 border border-blue-500/50">
                  Simultaneous Multi-Algorithm Evaluation
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span>
                    Dynamic: <span className="text-orange-400">{sc.dynamicDescription}</span>
                  </span>
                </div>
              </div>

              {scenario === 'gameai' && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 justify-center overflow-x-auto max-w-full" style={{ scrollbarWidth: 'none' }}>
                    {GAME_AI_BOARDS.map(({ id, label, icon }) => (
                      <button
                        key={id}
                        onClick={() => {
                          handleBoardChange(id);
                        }}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                          sim.gameBoard === id
                            ? 'bg-purple-900/40 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(139,92,246,0.25)]'
                            : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                        }`}
                      >
                        <span>{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(scenario === 'traffic' || scenario === 'evacuation' || scenario === 'robotics' || scenario === 'network') && (
                <div className="flex items-center gap-2 justify-center overflow-x-auto max-w-full scrollbar-none" style={{ scrollbarWidth: 'none' }}>
                  {MAP_REGISTRY[scenario]?.map(mapDef => (
                    <button
                      key={mapDef.id}
                      onClick={() => {
                        handleMapChange(mapDef.id);
                      }}
                      disabled={sim.isComputing || sim.isGraphLoading}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${
                        sim.mapId === mapDef.id
                          ? 'bg-purple-900/40 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(139,92,246,0.25)]'
                          : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                      }`}
                    >
                      <span>{mapDef.icon}</span>
                      {mapDef.label}
                    </button>
                  ))}
                </div>
              )}

              {scenario === 'network' && (
                <div className="flex flex-col md:flex-row flex-wrap items-center gap-2 justify-center w-full mt-1 bg-gray-900/60 p-2 rounded-xl border border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Mode:</span>
                    <select
                      value={sim.networkRoutingMode}
                      onChange={(e) => sim.setNetworkRoutingMode(e.target.value as 'default' | 'device-to-device')}
                      disabled={sim.isComputing || sim.status === 'running'}
                      className="bg-gray-800 border border-gray-600 rounded text-xs font-bold text-white px-2 py-1 outline-none focus:border-blue-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="default">Default (ISP Broadcast)</option>
                      <option value="device-to-device">Device to Device</option>
                    </select>
                  </div>

                  {sim.networkRoutingMode === 'device-to-device' && sim.currentGraph && (
                    <>
                      <div className="h-4 w-px bg-gray-700 hidden md:block mx-1"></div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold">Src:</span>
                        <select
                          value={sim.sourceDevice}
                          onChange={(e) => sim.setSourceDevice(e.target.value)}
                          disabled={sim.isComputing || sim.status === 'running'}
                          className="bg-gray-800 border border-green-900 rounded text-xs font-bold text-white px-2 py-1 outline-none focus:border-green-500 cursor-pointer disabled:opacity-50 max-w-[150px] truncate"
                        >
                          {sim.currentGraph.nodes
                            .filter(n => sim.mapId === 'campus' ? n.type === 'access_point' : (n.type === 'access_point' || n.type === 'server'))
                            .sort((a, b) => a.label.localeCompare(b.label))
                            .map(n => <option key={`src-${n.id}`} value={n.id}>{n.label.replace('\n', ' - ')}</option>)}
                        </select>
                      </div>
                      
                      <div className="text-gray-500 hidden md:block">→</div>
                      
                      <div className="flex items-center gap-2 relative">
                        <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Dst:</span>
                        
                        <div 
                          className={`bg-gray-800 border ${sim.destinationDevices.length > 0 ? 'border-red-900' : 'border-red-500'} rounded text-xs font-bold text-white px-2 py-1 flex items-center justify-between min-w-[120px] max-w-[150px] ${(sim.isComputing || sim.status === 'running') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-red-500'}`}
                          onClick={() => {
                            if (!sim.isComputing && sim.status !== 'running') {
                              setDstDropdownOpen(!dstDropdownOpen);
                            }
                          }}
                        >
                          <span className="truncate">{sim.destinationDevices.length > 0 ? `${sim.destinationDevices.length} Selected` : 'Select Dst...'}</span>
                          <span className="text-[10px] ml-2">▼</span>
                        </div>

                        {dstDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setDstDropdownOpen(false)}></div>
                            <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                              {sim.currentGraph.nodes
                                .filter(n => sim.mapId === 'campus' ? n.type === 'access_point' : (n.type === 'access_point' || n.type === 'server'))
                                .filter(n => n.id !== sim.sourceDevice)
                                .sort((a, b) => a.label.localeCompare(b.label))
                                .map(n => (
                                  <label key={`dst-${n.id}`} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 cursor-pointer">
                                    <input 
                                      type="checkbox" 
                                      className="accent-red-500"
                                      checked={sim.destinationDevices.includes(n.id)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          sim.setDestinationDevices([...sim.destinationDevices, n.id]);
                                        } else {
                                          sim.setDestinationDevices(sim.destinationDevices.filter(id => id !== n.id));
                                        }
                                      }}
                                    />
                                    <span className="text-xs text-gray-200 whitespace-nowrap">{n.label.replace('\n', ' - ')}</span>
                                  </label>
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="h-4 w-px bg-gray-700 hidden md:block mx-1"></div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sim.deliveryMode}
                          onChange={(e) => sim.setDeliveryMode(e.target.value as 'anycast' | 'multicast')}
                          disabled={sim.isComputing || sim.status === 'running'}
                          className="bg-gray-800 border border-purple-900/50 rounded text-[10px] uppercase font-bold text-gray-300 px-2 py-1.5 outline-none focus:border-purple-500 cursor-pointer disabled:opacity-50"
                        >
                          <option value="anycast">Anycast (Race to first)</option>
                          <option value="multicast">Multicast (Find all)</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
              )}
              {scenario === 'evacuation' && sim.currentGraph && (
                <div className="flex flex-col md:flex-row items-center gap-2 justify-center w-full mt-1 bg-gray-900/60 p-2 rounded-xl border border-gray-700/50">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
                      <span>🔥</span> STARTING POINT (SRC):
                    </span>
                    <select
                      value={sim.evacuationSourceId || sim.currentGraph.sourceId || ''}
                      onChange={(e) => sim.setEvacuationSourceId(e.target.value)}
                      disabled={sim.isComputing || sim.status === 'running'}
                      className="bg-gray-800 border border-emerald-800 rounded text-xs font-bold text-white px-3 py-1 outline-none focus:border-emerald-500 cursor-pointer disabled:opacity-50 max-w-[260px] md:max-w-[320px] truncate"
                    >
                      {sim.currentGraph.nodes
                        .filter(n => n.type === 'place' || n.type === 'origin' || n.type === 'room')
                        .sort((a, b) => {
                          if (a.buildingId !== b.buildingId) return (a.buildingId || '').localeCompare(b.buildingId || '');
                          return (a.label || a.id).localeCompare(b.label || b.id);
                        })
                        .map(n => (
                          <option key={`evac-src-${n.id}`} value={n.id}>
                            {n.buildingId ? `[${n.buildingId}] ` : ''}{n.label ? n.label.replace('\n', ' - ') : n.id}
                          </option>
                        ))}
                    </select>
                    {sim.evacuationSourceId && (
                      <button
                        onClick={() => sim.setEvacuationSourceId(null)}
                        disabled={sim.isComputing || sim.status === 'running'}
                        className="text-[11px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 px-2 py-1 rounded cursor-pointer transition-colors"
                        title="Reset to default starting room"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                </div>
              )}

            </div>

            <div
              className="rounded-2xl overflow-hidden border border-gray-700 w-full relative h-[50vh] lg:flex-1 lg:min-h-0 shadow-[0_0_48px_rgba(37,99,235,0.1)] bg-[#0a0f1e]"
              style={{ maxWidth: 1200 }}
            >
              {sim.currentGraph ? (
                <>
                  <NetworkCanvas
                    graph={sim.currentGraph}
                    activeSteps={sim.activeSteps}
                    scenario={scenario}
                    stepIndex={sim.stepIndex}
                    dynamicEvents={sim.simResults?.hybrid.dynamicEvents || []}
                    highlightedNodeId={highlightedNodeId}
                    onDeselect={() => setHighlightedNodeId(null)}
                    onNodeClick={(nodeId) => {
                      if (scenario === 'robotics') {
                        setHighlightedNodeId(prev => prev === nodeId ? null : nodeId);
                      }
                      // Evacuation: clicking a place/origin/room node sets it as the new start
                      if (isEvacuationRealWorld && !sim.isComputing) {
                        const node = sim.currentGraph?.nodes.find(n => n.id === nodeId);
                        if (node && (node.type === 'place' || node.type === 'origin' || node.type === 'room')) {
                          sim.setEvacuationSourceId(prev => prev === nodeId ? null : nodeId);
                        }
                      }
                    }}
                    mapId={sim.mapId}
                    shelfBoxCounts={shelfBoxCounts}
                    robotAssignments={sim.robotAssignments}
                  />

                  {scenario === 'network' && (sim.mapId === 'companybusiness' || sim.mapId === 'campus') && highlightedNodeId && (
                    <CiscoTerminal 
                      nodeId={highlightedNodeId} 
                      onClose={() => setHighlightedNodeId(null)} 
                    />
                  )}

                  {scenario === 'network' && (sim.mapId === 'companybusiness' || sim.mapId === 'campus') && (
                    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
                      {sim.currentGraph.nodes
                        .filter(n => ['mlt_sw1', 'main_router', 'college_router', 'hostel_router'].includes(n.id))
                        .map(n => (
                          <button
                            key={`terminal-btn-${n.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setHighlightedNodeId(prev => prev === n.id ? null : n.id);
                            }}
                            className={`px-3 py-1.5 rounded border font-mono text-xs shadow-md flex items-center gap-2 transition-colors cursor-pointer ${
                              highlightedNodeId === n.id 
                                ? 'bg-gray-800 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]' 
                                : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                            }`}
                          >
                            <span className="text-[14px]">📟</span>
                            {n.label ? n.label.split('\n')[0] : n.id} Terminal
                          </button>
                        ))}
                    </div>
                  )}
      

                  {sim.isGraphLoading && (
                    <div className="absolute inset-0 bg-[#0a0f1e]/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white gap-3 z-50 transition-all">
                      <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-sm font-mono tracking-wider font-bold shadow-black drop-shadow-md">
                        Resyncing Map...
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="absolute inset-0 bg-[#0a0f1e] flex flex-col items-center justify-center text-gray-500 gap-3">
                  <div className="w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                  <span className="text-sm font-mono tracking-wider">Syncing Topology Data...</span>
                </div>
              )}
            </div>

            <div className="mt-2 flex items-center gap-2 flex-wrap justify-center w-full shrink-0">
              {(() => {
                const baseBtnClass = "px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-lg text-xs xl:text-sm font-semibold transition-all duration-300 ease-out transform active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:transform-none flex items-center gap-1.5 xl:gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex-1 sm:flex-none justify-center whitespace-nowrap";
                
                let scenarioBtnClass = `${baseBtnClass} bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600`;
                if (scenario === 'network') {
                  scenarioBtnClass = `${baseBtnClass} bg-blue-900/40 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-800 hover:border-blue-500 hover:shadow-blue-900/50`;
                } else if (scenario === 'robotics') {
                  scenarioBtnClass = `${baseBtnClass} bg-orange-900/40 text-orange-300 hover:bg-orange-600 hover:text-white border border-orange-800 hover:border-orange-500 hover:shadow-orange-900/50`;
                } else if (scenario === 'traffic') {
                  scenarioBtnClass = `${baseBtnClass} bg-emerald-900/40 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-800 hover:border-emerald-500 hover:shadow-emerald-900/50`;
                } else if (scenario === 'evacuation') {
                  scenarioBtnClass = `${baseBtnClass} bg-red-900/40 text-red-300 hover:bg-red-600 hover:text-white border border-red-800 hover:border-red-500 hover:shadow-red-900/50`;
                } else if (scenario === 'gameai') {
                  scenarioBtnClass = `${baseBtnClass} bg-purple-900/40 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-800 hover:border-purple-500 hover:shadow-purple-900/50`;
                }

                const primaryBtnClass = "px-4 xl:px-6 py-1.5 xl:py-2 rounded-lg font-bold text-xs xl:text-sm transition-all duration-300 ease-out transform active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:transform-none flex items-center justify-center gap-1.5 xl:gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex-1 sm:flex-none whitespace-nowrap";

                return (
                  <>
                    <button
                      onClick={sim.handleRerollEvents}
                      disabled={sim.status === 'running'}
                      className={scenarioBtnClass}
                    >
                      🎲 Reroll Events
                    </button>

                    <button
                      disabled={sim.isComputing || sim.isGraphLoading}
                      onClick={sim.handleReset}
                      className={scenarioBtnClass}
                    >
                      🔄 Reset
                    </button>

                    <button
                      disabled={sim.isComputing || sim.isGraphLoading || sim.stepIndex === 0}
                      onClick={sim.handleStepBackward}
                      className={scenarioBtnClass}
                    >
                      ⏪ Back
                    </button>

                    {sim.status === 'running' ? (
                      <button
                        disabled={sim.isComputing || sim.isGraphLoading}
                        onClick={sim.handlePause}
                        className={`${primaryBtnClass} hover:bg-red-500 bg-red-600 text-white shadow-red-900/40`}
                      >
                        ⏸️ Pause
                      </button>
                    ) : sim.status === 'paused' ? (
                      <button
                        disabled={sim.isComputing || sim.isGraphLoading}
                        onClick={sim.handleResume}
                        className={`${primaryBtnClass} hover:bg-green-500 bg-green-600 text-white shadow-green-900/40`}
                      >
                        ▶️ Resume
                      </button>
                    ) : sim.status === 'done' ? (
                      <button
                        disabled={sim.isComputing || sim.isGraphLoading}
                        onClick={sim.handleRun}
                        className={`${primaryBtnClass} hover:bg-blue-500 bg-blue-600 text-white shadow-blue-900/40`}
                      >
                        🔄 Replay
                      </button>
                    ) : (
                      <button
                        disabled={sim.isComputing || sim.isGraphLoading}
                        onClick={sim.handleRun}
                        className={`${primaryBtnClass} w-full sm:w-auto hover:bg-green-500 bg-green-600 text-white shadow-green-900/40`}
                      >
                        {sim.isComputing ? 'Computing...' : '▶️ Run Simulations'}
                      </button>
                    )}

                    <button
                      disabled={sim.isComputing || sim.isGraphLoading || sim.stepIndex >= sim.totalSteps}
                      onClick={sim.handleStepForward}
                      className={scenarioBtnClass}
                    >
                      Fwd ⏭️
                    </button>
                    <button
                      disabled={sim.isComputing || sim.isGraphLoading}
                      onClick={sim.handleSkipEnd}
                      className={scenarioBtnClass}
                    >
                      ⏭️ Skip
                    </button>
                  </>
                );
              })()}
            </div>
          </main>

          <ResizableSidebar
            side="right"
            storageKey="sim_right_panel"
            defaultWidth={360}
            minWidth={300}
            maxWidth={480}
            className="border-t lg:border-t-0 lg:border-l border-white/5 lg:max-h-[calc(100vh-theme(spacing.20))] bg-[#0a0f1e]/50 backdrop-blur-sm"
            innerClassName="p-4 flex flex-col gap-4"
          >
            {sim.simResults && !sim.isComputing && sim.status === 'done' && sim.currentGraph && (
              <div className="shrink-0">
                <SimulationReport
                  multiResults={sim.simResults}
                  bfsResult={sim.bfsResult}
                  totalNodes={sim.currentGraph.nodes.length}
                  dynamicEvents={sim.simResults.hybrid.dynamicEvents}
                  onSaveResult={sim.openSaveModal}
                  isSaved={sim.isCurrentSaved}
                  scenarioColor={sc?.color}
                />
              </div>
            )}

            <div className="shrink-0">
              <DynamicMapEvents
                dynamicEvents={sim.simResults?.hybrid.dynamicEvents || []}
                stepIndex={sim.stepIndex}
                simResults={sim.simResults}
                scenario={scenario}
                onEventClick={handleEventClick}
                highlightedNodeId={highlightedNodeId}
              />
            </div>

            {scenario === 'robotics' && sim.currentGraph && (
              <>
                <RobotAssignmentPanel
                  assignments={sim.robotAssignments}
                  setAssignments={sim.setRobotAssignments}
                  depotNodes={sim.currentGraph.nodes.filter(n => n.type === 'depot')}
                  shelfNodes={sim.currentGraph.nodes.filter(n => n.type === 'shelf' || n.id.startsWith('dest_'))}
                  disabled={sim.isComputing || sim.status === 'running'}
                  mapId={sim.mapId}
                />

                  <RobotLiveStatusPanel
                    assignments={sim.robotAssignments}
                    activeSteps={sim.activeSteps}
                    graphNodes={sim.currentGraph.nodes}
                    onRobotClick={(nodeId) => setHighlightedNodeId(nodeId)}
                    mapId={sim.mapId}
                  />
              </>
            )}

            {sim.mapId === 'campus' && scenario === 'network' && (
              <div className="shrink-0 bg-gray-900 border border-indigo-900/50 rounded-xl p-4 flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
                <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-1">
                  Campus Topology Rules
                </div>
                <div className="text-xs text-gray-300 space-y-3 leading-relaxed">
                  <div>
                    <p className="text-gray-100 font-semibold mb-1">1. Routed Traffic with ACLs</p>
                    <p className="text-gray-400 mb-1">Traffic across subnets hits default gateways where routers apply Access Control Lists (ACLs):</p>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400">
                      <li><span className="text-blue-300 font-medium">Boys Block (192.168.3.x)</span> can ONLY communicate with <span className="text-blue-300 font-medium">AB1</span>.</li>
                      <li><span className="text-pink-300 font-medium">Girls Block (192.168.3.x)</span> can ONLY communicate with <span className="text-pink-300 font-medium">AB2</span>.</li>
                      <li>Packets to unauthorized zones are dropped at the College Router.</li>
                    </ul>
                    <p className="text-gray-500 italic mt-1.5 text-[10px]">Why? This simulates a strict university security policy, intentionally isolating student dormitories to specific academic clusters to prevent unauthorized campus-wide network access.</p>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-800">
                    <p className="text-gray-100 font-semibold mb-1">2. Local Switched Traffic</p>
                    <p className="text-gray-400">The <span className="text-yellow-400 font-medium">Yellow Zone (IT, Library, Dome)</span> shares a single subnet (192.168.1.x). Their traffic never touches a router; it flows freely via Layer 2 switching on S0, bypassing all security ACLs.</p>
                    <p className="text-gray-500 italic mt-1.5 text-[10px]">Why? This demonstrates how devices on the same local network (VLAN) communicate directly and efficiently through switches, avoiding router bottlenecks and firewall restrictions.</p>
                  </div>
                </div>
              </div>
            )}

            {scenario === 'gameai' && (
              <div className="shrink-0">
                <StrategyMapEvents
                  dynamicEvents={sim.simResults?.hybrid.dynamicEvents || []}
                  stepIndex={sim.stepIndex}
                  simResults={sim.simResults}
                />
              </div>
            )}

            {sim.mapId === 'synthetic' && (
              <div className="shrink-0 glass-panel rounded-xl p-4 flex flex-col gap-2 fade-in hover:shadow-glow-blue transition-shadow duration-500">
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">
                  Dynamic Size Adjuster
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  
                  {/* --- CUSTOM NODES ADJUSTER --- */}
                  <label className="flex items-center gap-1.5 flex-1 rounded-md border border-white/10 bg-black/40 shadow-inner pl-3 pr-0 py-1 overflow-hidden transition-colors focus-within:border-teal-500">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex-1">Nodes</span>
                    <div className="flex items-stretch bg-black/60 border-l border-white/10 h-full ml-1">
                      <input
                        type="number"
                        min={MIN_SYNTHETIC_NODES[scenario]}
                        max={MAX_SYNTHETIC_NODES[scenario]}
                        value={localNodesInput}
                        onChange={(event) => setLocalNodesInput(event.target.value)}
                        onBlur={() => {
                          if (localNodesInput !== '') sim.updateSyntheticSizing('nodes', Number(localNodesInput));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && localNodesInput !== '') {
                            sim.updateSyntheticSizing('nodes', Number(localNodesInput));
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        /* Tailwind magic to completely hide the ugly default browser arrows */
                        className="w-10 bg-transparent py-1 text-center text-xs font-bold text-teal-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 m-0"
                      />
                      <div className="flex flex-col border-l border-white/10 bg-black/40 w-5">
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.nodes >= MAX_SYNTHETIC_NODES[scenario]}
                          onClick={() => {
                            if (scenario === 'gameai' && sim.gameBoard) {
                              sim.updateSyntheticSizing('nodes', getNextGameAINodes(sim.syntheticSizing.nodes, 'up', sim.gameBoard));
                            } else if (scenario === 'robotics') {
                              sim.updateSyntheticSizing('nodes', getNextRoboticsNodes(sim.syntheticSizing.nodes, 'up'));
                            } else {
                              sim.updateSyntheticSizing('nodes', sim.syntheticSizing.nodes + 1);
                            }
                          }}
                          className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.nodes <= MIN_SYNTHETIC_NODES[scenario]}
                          onClick={() => {
                            if (scenario === 'gameai' && sim.gameBoard) {
                              sim.updateSyntheticSizing('nodes', getNextGameAINodes(sim.syntheticSizing.nodes, 'down', sim.gameBoard));
                            } else if (scenario === 'robotics') {
                              sim.updateSyntheticSizing('nodes', getNextRoboticsNodes(sim.syntheticSizing.nodes, 'down'));
                            } else {
                              sim.updateSyntheticSizing('nodes', sim.syntheticSizing.nodes - 1);
                            }
                          }}
                          className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 border-t border-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  </label>

                  {/* --- CUSTOM LINKS ADJUSTER --- */}
                  <label className="flex items-center gap-1.5 flex-1 rounded-md border border-white/10 bg-black/40 shadow-inner pl-3 pr-0 py-1 overflow-hidden transition-colors focus-within:border-teal-500">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex-1">Links</span>
                    <div className="flex items-stretch bg-black/60 border-l border-white/10 h-full ml-1">
                      <input
                        type="number"
                        min={MIN_SYNTHETIC_LINKS[scenario]}
                        max={1600}
                        value={localEdgesInput}
                        onChange={(event) => setLocalEdgesInput(event.target.value)}
                        onBlur={() => {
                          if (localEdgesInput !== '') sim.updateSyntheticSizing('edges', Math.max(MIN_SYNTHETIC_LINKS[scenario], Number(localEdgesInput)));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && localEdgesInput !== '') {
                            sim.updateSyntheticSizing('edges', Math.max(MIN_SYNTHETIC_LINKS[scenario], Number(localEdgesInput)));
                            (e.target as HTMLInputElement).blur();
                          }
                        }}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        className="w-10 bg-transparent py-1 text-center text-xs font-bold text-teal-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 m-0"
                      />
                      <div className="flex flex-col border-l border-white/10 bg-black/40 w-5">
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || generatedEdgeCount >= 1600}
                          onClick={() => sim.updateSyntheticSizing('edges', generatedEdgeCount + 1)}
                          className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || generatedEdgeCount <= MIN_SYNTHETIC_LINKS[scenario]}
                          onClick={() => sim.updateSyntheticSizing('edges', generatedEdgeCount - 1)}
                          className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 border-t border-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  </label>

                </div>
                
                <div className="text-center mt-1 text-[9px] text-gray-500 tracking-wider">
                  Generated: {generatedNodeCount} nodes / {generatedEdgeCount} links
                </div>
              </div>
            )}
          </ResizableSidebar>
        </div>
      </div>

      <HistoryModal
        isOpen={sim.isHistoryModalOpen}
        onClose={() => sim.setIsHistoryModalOpen(false)}
        history={sim.history}
        scenario={scenario}
        onDeleteHistory={sim.handleDeleteHistory}
        onImportHistory={sim.handleImportHistory}
      />
      {sim.isSaveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">💾 Save Result to History</h3>
              <p className="text-sm text-gray-400 mb-5">
                Enter a custom name for this simulation run to easily identify it later.
              </p>

              <input
                type="text"
                value={sim.saveNameInput}
                onChange={(e) => sim.setSaveNameInput(e.target.value)}
                placeholder={sim.saveDefaultName}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && sim.confirmSaveResult()}
              />
            </div>

            <div className="bg-gray-950 border-t border-gray-800 p-4 flex justify-end gap-3">
              <button
                onClick={() => sim.setIsSaveModalOpen(false)}
                className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={sim.confirmSaveResult}
                className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer"
              >
                Save Result
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
