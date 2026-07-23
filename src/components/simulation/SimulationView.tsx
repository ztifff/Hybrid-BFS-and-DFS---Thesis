import React, { useMemo, useState } from 'react';

import { ScenarioType, GameAIBoard } from '../../types';
import { useSimulation } from '../../hooks/useSimulation';
import { getScenario } from '../../config/scenarios';
import { CiscoTerminal } from '../../components/CiscoTerminal';
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

interface Props {
  scenario: ScenarioType;
  onBack: () => void;
}

const GAME_AI_BOARDS: { id: GameAIBoard; label: string; icon: string }[] = [
  { id: 'dama', label: 'Turkish Draughts', icon: '🔵' },
  { id: 'checkers', label: 'Checkers', icon: '⚫' },
];

const MIN_SYNTHETIC_NODES: Record<ScenarioType, number> = {
  network: 7,
  robotics: 10,
  traffic: 9,
  evacuation: 10,
  gameai: 18,
};

const MAX_SYNTHETIC_NODES: Record<ScenarioType, number> = {
  network: 220,
  robotics: 220,
  traffic: 220,
  evacuation: 220,
  gameai: 220,
};

export const SimulationView: React.FC<Props> = ({ scenario, onBack }) => {
  const sc = getScenario(scenario);

  const sim = useSimulation({ scenario });

  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  // Network routing DST dropdown state
  const [dstDropdownOpen, setDstDropdownOpen] = useState(false);

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
        // Use the max count if multiple robots share a destination
        map.set(destId, Math.max(map.get(destId) ?? 0, count));
      });
    });
    return map;
  }, [scenario, sim.robotAssignments]);
  const generatedNodeCount = sim.currentGraph?.nodes.length ?? sim.syntheticSizing.nodes;
  const generatedEdgeCount = sim.currentGraph?.edges.length ?? sim.syntheticSizing.edges;

  return (
    <>
      {isHelpOpen && <HelpModal scenario={scenario} onClose={() => setIsHelpOpen(false)} />}
      <div className="min-h-screen lg:h-screen w-full max-w-[100vw] bg-[#0a0f1e] text-white flex flex-col relative z-0 lg:overflow-hidden">
        <header className="border-b border-gray-800 px-3 md:px-6 py-2.5 md:py-3 flex items-center justify-between bg-[#0d1224] shrink-0 relative gap-2 w-full max-w-full">
          <div className="flex items-center gap-2 sm:gap-4 relative z-10 shrink-0">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1 cursor-pointer shrink-0"
            >
              ← <span className="hidden sm:inline">Back</span>
            </button>

            <div className="h-5 w-px bg-gray-700 hidden sm:block" />

            <div className="text-sm flex items-center gap-3 shrink-0">
              <span className="text-xl hidden lg:inline">{sc.icon}</span>
              <span className="font-bold text-white hidden lg:inline">{sc.name}</span>
              <span className="text-gray-500 hidden lg:inline">·</span>
              <div className="flex items-center gap-2 text-xs font-bold bg-[#111827] border border-gray-700 rounded-md px-3 py-1.5 shadow-inner">
                <span className="text-green-400">BFS</span>
                <span className="text-gray-600">|</span>
                <span className="text-purple-400">DFS</span>
                <span className="text-gray-600">|</span>
                <span className="text-orange-400">Hybrid</span>
              </div>
            </div>
          </div>

          <div className="z-20 md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 shrink-0 ml-auto md:ml-0 flex items-center justify-center">
            <button
              onClick={() => sim.setIsHistoryModalOpen(true)}
              className="px-2.5 sm:px-5 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full text-xs font-bold text-white shadow-md transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer"
            >
              🗄️
              <span className="hidden sm:inline">Result History</span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none">
                {scenarioHistoryCount}
              </span>
            </button>
          </div>

          <div className="z-20 shrink-0 ml-2 sm:ml-4 flex items-center">
            <button
              onClick={() => setIsHelpOpen(true)}
              title="Help & Guide"
              className="w-8 h-8 md:w-auto md:h-auto md:px-4 md:py-1.5 rounded-full md:rounded-md bg-[#0a0f1e] border text-gray-200 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
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
          <aside
            className="w-full lg:w-80 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-gray-800 p-4 flex flex-col gap-4 overflow-y-auto lg:max-h-[calc(100vh-theme(spacing.20))]"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
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
          </aside>

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
                          sim.setGameBoard(id);
                          sim.setMapId('synthetic');
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
                        sim.setMapId(mapDef.id);
                        if (mapDef.isRealWorld) sim.setGraphSize('medium');
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

              {scenario === 'network' && (sim.mapId === 'companybusiness' || sim.mapId === 'campus') && (
                <div className="flex flex-col md:flex-row items-center gap-2 justify-center w-full mt-1 bg-gray-900/60 p-2 rounded-xl border border-gray-700/50">
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
                    }}
                    mapId={sim.mapId}
                    shelfBoxCounts={shelfBoxCounts}
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
              <button
                onClick={sim.handleRerollEvents}
                disabled={sim.status === 'running'}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-amber-500 border border-gray-600 rounded-md font-bold text-sm transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                🎲 Reroll Events
              </button>

              <button
                disabled={sim.isComputing || sim.isGraphLoading}
                onClick={sim.handleReset}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none"
              >
                🔄 Reset
              </button>

              <button
                disabled={sim.isComputing || sim.isGraphLoading || sim.stepIndex === 0}
                onClick={sim.handleStepBackward}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none"
              >
                ⏪ Back
              </button>

              {sim.status === 'running' ? (
                <button
                  disabled={sim.isComputing || sim.isGraphLoading}
                  onClick={sim.handlePause}
                  className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer hover:bg-red-500 disabled:opacity-30 flex-1 sm:flex-none bg-red-600 text-white shadow-lg shadow-red-900/20"
                >
                  ⏸️ Pause
                </button>
              ) : sim.status === 'paused' ? (
                <button
                  disabled={sim.isComputing || sim.isGraphLoading}
                  onClick={sim.handleResume}
                  className="px-6 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer hover:bg-green-500 disabled:opacity-30 flex-1 sm:flex-none bg-green-600 text-white shadow-lg shadow-green-900/20"
                >
                  ▶️ Resume
                </button>
              ) : sim.status === 'done' ? (
                <button
                  disabled={sim.isComputing || sim.isGraphLoading}
                  onClick={sim.handleRun}
                  className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-blue-500 disabled:opacity-30 flex-1 sm:flex-none bg-blue-600 text-white"
                >
                  🔄 Replay
                </button>
              ) : (
                <button
                  disabled={sim.isComputing || sim.isGraphLoading}
                  onClick={sim.handleRun}
                  className="px-6 py-2 rounded-lg font-bold text-sm cursor-pointer hover:bg-green-500 disabled:opacity-30 flex-1 sm:flex-none w-full sm:w-auto bg-green-600 text-white shadow-lg shadow-green-900/20"
                >
                  {sim.isComputing ? 'Computing...' : '▶️ Run Simulations'}
                </button>
              )}

              <button
                disabled={sim.isComputing || sim.isGraphLoading || sim.stepIndex >= sim.totalSteps}
                onClick={sim.handleStepForward}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none"
              >
                Fwd ⏭️
              </button>
              <button
                disabled={sim.isComputing || sim.isGraphLoading}
                onClick={sim.handleSkipEnd}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm font-semibold transition-colors cursor-pointer disabled:opacity-30 flex-1 sm:flex-none"
              >
                ⏭️ Skip
              </button>
            </div>
          </main>

          <aside
            className="w-full lg:w-80 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-gray-800 p-4 flex flex-col gap-4 bg-[#0a0f1e] overflow-y-auto lg:max-h-[calc(100vh-theme(spacing.20))]"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
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

            {scenario === 'robotics' && sim.mapId !== 'synthetic' && sim.currentGraph && (
              <RobotAssignmentPanel
                assignments={sim.robotAssignments}
                setAssignments={sim.setRobotAssignments}
                depotNodes={sim.currentGraph.nodes.filter(n => n.type === 'depot')}
                shelfNodes={sim.currentGraph.nodes.filter(n => n.type === 'shelf')}
                disabled={sim.isComputing || sim.status === 'running'}
              />
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
              <div className="shrink-0 bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col gap-2">
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">
                  Dynamic Size Adjuster
                </div>
                
                <div className="flex items-center justify-between gap-2">
                  
                  {/* --- CUSTOM NODES ADJUSTER --- */}
                  <label className="flex items-center gap-1.5 flex-1 rounded-md border border-gray-700 bg-gray-800 pl-3 pr-0 py-1 overflow-hidden transition-colors focus-within:border-teal-500">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex-1">Nodes</span>
                    <div className="flex items-stretch bg-gray-950 border-l border-gray-700 h-full ml-1">
                      <input
                        type="number"
                        min={MIN_SYNTHETIC_NODES[scenario]}
                        max={MAX_SYNTHETIC_NODES[scenario]}
                        value={sim.syntheticSizing.nodes}
                        onChange={(event) => {
                          if (event.target.value !== '') sim.updateSyntheticSizing('nodes', Number(event.target.value));
                        }}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        /* Tailwind magic to completely hide the ugly default browser arrows */
                        className="w-10 bg-transparent py-1 text-center text-xs font-bold text-teal-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 m-0"
                      />
                      <div className="flex flex-col border-l border-gray-700 bg-gray-900 w-5">
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.nodes >= MAX_SYNTHETIC_NODES[scenario]}
                          onClick={() => sim.updateSyntheticSizing('nodes', sim.syntheticSizing.nodes + 1)}
                          className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.nodes <= MIN_SYNTHETIC_NODES[scenario]}
                          onClick={() => sim.updateSyntheticSizing('nodes', sim.syntheticSizing.nodes - 1)}
                          className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 border-t border-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  </label>

                  {/* --- CUSTOM LINKS ADJUSTER --- */}
                  <label className="flex items-center gap-1.5 flex-1 rounded-md border border-gray-700 bg-gray-800 pl-3 pr-0 py-1 overflow-hidden transition-colors focus-within:border-teal-500">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex-1">Links</span>
                    <div className="flex items-stretch bg-gray-950 border-l border-gray-700 h-full ml-1">
                      <input
                        type="number"
                        min={4}
                        max={1600}
                        value={sim.syntheticSizing.edges}
                        onChange={(event) => {
                          if (event.target.value !== '') sim.updateSyntheticSizing('edges', Number(event.target.value));
                        }}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        className="w-10 bg-transparent py-1 text-center text-xs font-bold text-teal-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 m-0"
                      />
                      <div className="flex flex-col border-l border-gray-700 bg-gray-900 w-5">
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.edges >= 1600}
                          onClick={() => sim.updateSyntheticSizing('edges', sim.syntheticSizing.edges + 1)}
                          className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button
                          type="button"
                          disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.edges <= 4}
                          onClick={() => sim.updateSyntheticSizing('edges', sim.syntheticSizing.edges - 1)}
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
          </aside>
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
