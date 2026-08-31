import React, { useState, useEffect } from 'react';
import { TutorialOverlay, useTutorial, TUTORIAL_STEPS } from '../TutorialOverlay';

import { ScenarioType } from '../../types';
import { useSimulation } from '../../hooks/useSimulation';
import { MAX_SYNTHETIC_NODES, MIN_SYNTHETIC_NODES, MIN_SYNTHETIC_LINKS, GAME_AI_BOARDS, SizingKey } from '../../hooks/useSimulationModel';
import { getScenario } from '../../config/scenarios';
import { CiscoTerminal } from '../NetworkCanvas/renderers/scenarios/network/CiscoTerminal';
import { MAP_REGISTRY } from '../../config/mapRegistry';

import { NetworkCanvas } from '../../components/NetworkCanvas';
import { MetricsPanel } from './MetricsPanel';
import { Network, Bot, Car, Flame, Gamepad2 } from '../../components/icons';
import { Legend } from '../../components/Legend';
import { SimulationReport } from './SimulationReport';
import { HistoryModal } from '../../components/HistoryModal';
import { DynamicMapEvents } from './DynamicMapEvents';
import { StrategyMapEvents } from './StrategyMapEvents';
import { HelpModal } from '../../components/HelpModal';
import { RobotAssignmentPanel } from './RobotAssignmentPanel';
import { RobotLiveStatusPanel } from './RobotLiveStatusPanel';
import { ResizableSidebar } from '../layout/ResizableSidebar';
import { ExpertModePanel } from './ExpertModePanel';

interface Props {
  scenario: ScenarioType;
  onBack: () => void;
}

function SpeedController({
  playbackSpeed,
  handleSpeedChange,
  scenario
}: {
  playbackSpeed: number;
  handleSpeedChange: (speed: number) => void;
  scenario: string;
}) {
  const [inputValue, setInputValue] = useState(playbackSpeed.toFixed(1));

  useEffect(() => {
    setInputValue(playbackSpeed.toFixed(1));
  }, [playbackSpeed]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      handleSpeedChange(val);
    }
  };

  const handleBlur = () => {
    let val = parseFloat(inputValue);
    if (isNaN(val)) val = 1;
    val = Math.max(0.1, Math.min(4, val));
    handleSpeedChange(val);
    setInputValue(val.toFixed(1));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    handleSpeedChange(val);
    setInputValue(val.toFixed(1));
  };

  return (
    <div className="flex items-center gap-3 text-xs text-gray-400 bg-[#0a0f1e]/80 border border-white/10 px-4 py-1.5 rounded-full shadow-inner backdrop-blur-sm">
      <span className="uppercase tracking-wider font-semibold">Speed</span>
      <input
        type="range"
        min="0.1" max="4" step="0.1"
        value={playbackSpeed}
        onChange={handleSliderChange}
        className={`w-32 cursor-pointer transition-all ${scenario === 'network' ? 'accent-blue-500' :
            scenario === 'robotics' ? 'accent-amber-500' :
              scenario === 'traffic' ? 'accent-emerald-500' :
                scenario === 'evacuation' ? 'accent-red-500' :
                  scenario === 'gameai' ? 'accent-purple-500' : 'accent-blue-500'
          }`}
      />
      <div className="flex items-center w-14 justify-end text-white font-bold font-mono">
        <input
          type="number"
          min="0.1" max="4" step="0.1"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-10 bg-transparent text-right outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span>x</span>
      </div>
    </div>
  );
}

export const SimulationView: React.FC<Props> = ({ scenario, onBack }) => {
  const sc = getScenario(scenario);
  const sim = useSimulation({ scenario, onBack });

  // ── Purely local UI state (nothing to do with business logic) ───────────────
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [dstDropdownOpen, setDstDropdownOpen] = useState(false);
  const [dstMinWarning, setDstMinWarning] = useState(false);
  const [isExpertMode, setIsExpertMode] = useState(false);
  const [showExpertWarning, setShowExpertWarning] = useState(false);
  const [trafDstDropdownOpen, setTrafDstDropdownOpen] = useState(false);
  const [trafSrcDropdownOpen, setTrafSrcDropdownOpen] = useState(false);
  const [trafSrcSearch, setTrafSrcSearch] = useState('');
  const [trafDstSearch, setTrafDstSearch] = useState('');
  const tutorial = useTutorial();

  const handleEventClick = (nodeId: string) => {
    setHighlightedNodeId(prev => prev === nodeId ? null : nodeId);
  };

  // ── Button style helpers ────────────────────────────────────────────────────
  const baseBtnClass = "px-2.5 xl:px-4 py-1.5 xl:py-2 rounded-lg text-xs xl:text-sm font-semibold transition-all duration-300 ease-out transform active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:transform-none flex items-center gap-1.5 xl:gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 flex-1 sm:flex-none justify-center whitespace-nowrap";

  const scenarioBtnClass = (() => {
    const map: Record<ScenarioType, string> = {
      network: `${baseBtnClass} bg-blue-900/40 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-800 hover:border-blue-500 hover:shadow-blue-900/50`,
      robotics: `${baseBtnClass} bg-orange-900/40 text-orange-300 hover:bg-orange-600 hover:text-white border border-orange-800 hover:border-orange-500 hover:shadow-orange-900/50`,
      traffic: `${baseBtnClass} bg-emerald-900/40 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-800 hover:border-emerald-500 hover:shadow-emerald-900/50`,
      evacuation: `${baseBtnClass} bg-red-900/40 text-red-300 hover:bg-red-600 hover:text-white border border-red-800 hover:border-red-500 hover:shadow-red-900/50`,
      gameai: `${baseBtnClass} bg-purple-900/40 text-purple-300 hover:bg-purple-600 hover:text-white border border-purple-800 hover:border-purple-500 hover:shadow-purple-900/50`,
    };
    return map[scenario] ?? `${baseBtnClass} bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600`;
  })();

  const activeTabClass = (() => {
    const map: Record<ScenarioType, string> = {
      network: 'bg-blue-900/40 text-blue-300 border border-blue-500/60 shadow-[0_0_10px_rgba(59,130,246,0.25)]',
      robotics: 'bg-orange-900/40 text-orange-300 border border-orange-500/60 shadow-[0_0_10px_rgba(249,115,22,0.25)]',
      traffic: 'bg-emerald-900/40 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.25)]',
      evacuation: 'bg-red-900/40 text-red-300 border border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.25)]',
      gameai: 'bg-purple-900/40 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(139,92,246,0.25)]',
    };
    return map[scenario] ?? 'bg-purple-900/40 text-purple-300 border border-purple-500/60 shadow-[0_0_10px_rgba(139,92,246,0.25)]';
  })();

  // ── Auto-trigger specific tutorial steps on map change ──────────
  useEffect(() => {
    if (tutorial.isOpen) return;

    let panelId: string | null = null;
    if (scenario === 'robotics') panelId = 'robotics';
    else if (scenario === 'network' && sim.mapId === 'campus') panelId = 'network_campus';
    else if (scenario === 'gameai') panelId = 'gameai';

    if (panelId) {
      const seenRaw = localStorage.getItem('hybrid_sim_tutorial_seen_panels');
      const seen: string[] = seenRaw ? JSON.parse(seenRaw) : [];
      if (!seen.includes(panelId)) {
        const stepIdx = TUTORIAL_STEPS.findIndex(s => s.target === 'tutorial-scenario-panels');
        if (stepIdx !== -1) {
          const t = setTimeout(() => {
            tutorial.startAt(stepIdx);
            seen.push(panelId!);
            localStorage.setItem('hybrid_sim_tutorial_seen_panels', JSON.stringify(seen));
          }, 800);
          return () => clearTimeout(t);
        }
      }
    }
  }, [scenario, sim.mapId, tutorial.isOpen, tutorial.startAt]);

  const primaryBtnClass = "px-4 xl:px-6 py-1.5 xl:py-2 rounded-lg font-bold text-xs xl:text-sm transition-all duration-300 ease-out transform active:scale-[0.97] cursor-pointer disabled:opacity-30 disabled:pointer-events-none disabled:transform-none flex items-center justify-center gap-1.5 xl:gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex-1 sm:flex-none whitespace-nowrap";

  return (
    <>
      {/* Tutorial overlay */}
      <TutorialOverlay
        isOpen={tutorial.isOpen}
        stepIndex={tutorial.stepIndex}
        scenario={scenario}
        onNext={tutorial.next}
        onPrev={tutorial.prev}
        onClose={tutorial.close}
        onGoTo={tutorial.goTo}
      />

      {/* ── Unsaved-result / in-progress action guard modal ───────────────────── */}
      {sim.pendingNavigation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
          <div className={`bg-gray-900 border rounded-xl p-6 max-w-sm w-full shadow-2xl scale-in ${sim.pendingNavigation.reason === 'inprogress' ? 'border-blue-500/30' : 'border-amber-500/30'}`}>
            <h3 className={`font-bold text-lg mb-2 flex items-center gap-2 ${sim.pendingNavigation.reason === 'inprogress' ? 'text-blue-400' : 'text-amber-400'}`}>
              <span className="text-xl">{sim.pendingNavigation.reason === 'inprogress' ? '❗' : '⚠️'}</span>
              {sim.pendingNavigation.reason === 'inprogress' ? 'Simulation in Progress' : 'Unsaved Results'}
            </h3>
            <p className="text-gray-300 text-sm mb-6 leading-relaxed">
              {sim.pendingNavigation.type === 'skip'
                ? 'Simulation is currently running. Are you sure you want to skip to the end?'
                : sim.pendingNavigation.reason === 'inprogress'
                  ? 'Simulation is currently running. Are you sure you want to stop it and reset?'
                  : 'You have an unsaved simulation result. Are you sure you want to discard it and leave?'}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => sim.setPendingNavigation(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={sim.confirmPendingNavigation}
                className={`px-4 py-2 text-white rounded-lg text-sm font-bold transition-colors shadow-lg ${sim.pendingNavigation.reason === 'inprogress' ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20' : 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/20'}`}
              >
                {sim.pendingNavigation.type === 'skip'
                  ? 'Skip to End'
                  : sim.pendingNavigation.reason === 'inprogress'
                    ? 'Stop & Reset'
                    : 'Discard & Leave'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen lg:h-screen w-full max-w-[100vw] bg-transparent text-white flex flex-col relative z-0 lg:overflow-hidden fade-in">
        {/* Help Modal */}
        {isHelpOpen && <HelpModal onClose={() => setIsHelpOpen(false)} scenario={scenario} onStartTutorial={tutorial.start} />}

        {/* Expert Mode Warning */}
        {showExpertWarning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-gray-900 border border-green-500/50 rounded-xl p-6 max-w-sm w-full shadow-2xl scale-in font-mono">
              <h3 className="text-green-400 font-bold text-lg mb-2 flex items-center gap-2">
                <span className="animate-pulse">{'>_'}</span> Enable Expert Mode?
              </h3>
              <p className="text-gray-300 text-xs mb-6 leading-relaxed">
                Expert mode displays raw algorithmic telemetry (Queue/Stack memory, phase states, and real-time node evaluations). This requires additional rendering and may impact performance on large maps.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowExpertWarning(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setShowExpertWarning(false); setIsExpertMode(true); }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-green-900/20 cursor-pointer"
                >
                  Enable Telemetry
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <header className="glass-panel border-b-0 border-white/5 px-2 sm:px-3 md:px-6 py-2.5 md:py-3 flex flex-wrap lg:flex-nowrap items-center justify-between shrink-0 relative z-10 gap-y-2 gap-x-1.5 w-full max-w-full">

          {/* Left: Back & Title */}
          <div className="flex items-center gap-1.5 sm:gap-4 relative z-10 min-w-0 flex-1 lg:flex-none">
            <button
              onClick={() => sim.requestBack(sim.status, sim.isCurrentSaved)}
              className="px-2 sm:px-3 py-2 text-gray-400 hover:text-white flex items-center gap-1 sm:gap-2 transition-all hover:bg-white/5 rounded-lg text-sm font-bold whitespace-nowrap active:scale-95 shrink-0"
            >
              <span className="opacity-70 text-lg">←</span> <span className="hidden sm:inline tracking-wider">Back</span>
            </button>
            <div className="h-6 w-px bg-white/10 hidden sm:block mx-0.5 shrink-0"></div>
            <div
              data-tutorial="tutorial-header-title"
              className="flex items-center gap-1.5 sm:gap-3 bg-[#0a0f1e]/80 px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-xl border border-white/10 shadow-inner min-w-0"
            >
              <span className="text-xl sm:text-2xl drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] shrink-0 flex items-center justify-center" style={{ color: sc?.color }}>
                {(() => {
                  const className = "w-6 h-6 sm:w-8 sm:h-8";
                  switch (scenario) {
                    case 'network': return <Network className={className} />;
                    case 'robotics': return <Bot className={className} />;
                    case 'traffic': return <Car className={className} />;
                    case 'evacuation': return <Flame className={className} />;
                    case 'gameai': return <Gamepad2 className={className} />;
                    default: return <Network className={className} />;
                  }
                })()}
              </span>
              <h1 className="font-bold text-xs sm:text-base md:text-lg text-white tracking-widest drop-shadow-md truncate">{sc?.name}</h1>
            </div>
          </div>

          {/* Center: Algorithm toggle pills (Wraps to new line on mobile) */}
          <div
            data-tutorial="tutorial-algo-pills"
            className="flex items-center justify-center gap-2 sm:gap-3 px-2 sm:px-4 py-1.5 bg-black/40 rounded-full border border-white/5 text-[9px] sm:text-[10px] font-bold tracking-widest uppercase order-3 lg:order-none w-full lg:w-auto shrink-0 relative lg:mx-4"
          >
            {sim.minAlgoWarning && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap z-[9999]
                flex items-center gap-1.5 px-4 py-2.5 rounded-lg
                bg-amber-950/95 border border-amber-500/60 text-amber-300
                text-xs font-bold shadow-[0_0_20px_rgba(245,158,11,0.25)]
                animate-fadeIn pointer-events-none">
                <span className="text-amber-400">⚠</span>
                At least 1 algorithm must remain active
              </div>
            )}
            {([
              { id: 'bfs' as const, label: 'BFS', textCls: 'text-green-400', dotCls: 'bg-green-500', hoverBg: 'hover:bg-green-500/15', activeBg: 'bg-green-500/10', glow: 'rgba(74,222,128,0.5)', dotGlow: 'rgba(34,197,94,0.8)' },
              { id: 'dfs' as const, label: 'DFS', textCls: 'text-purple-400', dotCls: 'bg-purple-500', hoverBg: 'hover:bg-purple-500/15', activeBg: 'bg-purple-500/10', glow: 'rgba(192,132,252,0.5)', dotGlow: 'rgba(168,85,247,0.8)' },
              { id: 'hybrid' as const, label: 'Hybrid', textCls: 'text-orange-400', dotCls: 'bg-orange-500', hoverBg: 'hover:bg-orange-500/15', activeBg: 'bg-orange-500/10', glow: 'rgba(251,146,60,0.5)', dotGlow: 'rgba(249,115,22,0.8)' },
            ]).map(({ id, label, textCls, dotCls, hoverBg, activeBg, glow, dotGlow }, i) => (
              <React.Fragment key={id}>
                {i > 0 && <span className="text-gray-600">|</span>}
                <button
                  onClick={() => sim.toggleAlgorithm(id)}
                  title={sim.activeAlgorithms[id] ? `Hide ${label} from simulation view` : `Show ${label} in simulation view`}
                  className={`flex items-center gap-1.5 rounded-md px-1.5 sm:px-2 py-1 transition-all duration-150 cursor-pointer select-none ${sim.activeAlgorithms[id]
                    ? `${textCls} ${activeBg} ${hoverBg} drop-shadow-[0_0_6px_${glow}] hover:drop-shadow-[0_0_12px_${glow}] hover:brightness-125 active:scale-95`
                    : `text-gray-500 opacity-50 hover:opacity-75 hover:bg-white/5 active:scale-95`
                    }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200 ${sim.activeAlgorithms[id] ? `${dotCls} shadow-[0_0_8px_${dotGlow}]` : 'bg-gray-600'
                    }`} />
                  <span className={sim.activeAlgorithms[id] ? '' : 'line-through'}>{label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative z-10 ml-auto order-2 lg:order-none">
            <button
              data-tutorial="tutorial-result-history"
              onClick={() => sim.setIsHistoryModalOpen(true)}
              className="px-2.5 sm:px-4 py-1.5 rounded-lg glass-panel text-gray-200 hover:text-white text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] shadow-md hover:shadow-glow-blue hover:border-blue-500/50"
            >
              <span className="hidden sm:inline">Result History</span>
              <span className="sm:hidden text-base">🗄️</span>
              <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded-full leading-none min-w-[20px] text-center">
                {sim.scenarioHistoryCount}
              </span>
            </button>
          </div>

          <div className="z-20 shrink-0 ml-2 sm:ml-4 flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => isExpertMode ? setIsExpertMode(false) : setShowExpertWarning(true)}
              title="Expert Mode (Raw Telemetry)"
              className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer hover:-translate-y-0.5 active:scale-[0.98] ${isExpertMode ? 'bg-green-900/40 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'bg-gray-800/50 border-gray-600 text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
            >
              <span className={isExpertMode ? "animate-pulse" : ""}>{'>_'}</span>
              <span>Expert</span>
            </button>
            <button
              data-tutorial="tutorial-help-btn"
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
                <span className="text-lg leading-none filter drop-shadow-sm md:hidden">{sc?.icon || '❓'}</span>
                Help &amp; Guide
              </span>
            </button>
          </div>
        </header>

        <div className="flex flex-col lg:flex-row flex-1 lg:min-h-0 overflow-y-auto lg:overflow-hidden">

          {/* ── Left Sidebar: Metrics ─────────────────────────────────────────── */}
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
              <div data-tutorial="tutorial-metrics-panel" className="w-full shrink-0">
                <MetricsPanel
                  multiResults={sim.simResults}
                  activeSteps={sim.activeSteps}
                  scenario={scenario}
                  status={sim.status}
                  stepIndex={sim.stepIndex}
                  totalSteps={sim.totalSteps}
                  totalNodes={sim.currentGraph.nodes.length}
                  optimalPathLength={sim.bfsResult?.pathLength ?? 0}
                  activeAlgorithms={sim.activeAlgorithms}
                  mapId={sim.mapId}
                />
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 flex flex-col items-center justify-center py-12 text-center text-gray-400 animate-pulse">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <div>Fetching evaluation matrices from backend...</div>
              </div>
            )}

            <div data-tutorial="tutorial-legend" className="w-full shrink-0">
              <Legend scenario={scenario} mapId={sim.mapId} />
            </div>
          </ResizableSidebar>

          {/* ── Main Canvas Area ──────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col items-center justify-start p-4 w-full relative lg:overflow-hidden min-h-0">

            {/* Scenario / Map / Board selectors */}
            <div className="mb-1 flex flex-col items-center gap-1.5 w-full shrink-0">
              <div className="flex items-center gap-2 flex-wrap justify-center text-center">
                <div className="px-3 py-1 rounded-full text-xs font-bold bg-blue-900/20 text-blue-400 border border-blue-500/50">
                  Simultaneous Multi-Algorithm Evaluation
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-2">
                  <span>Dynamic: <span className="text-orange-400">{sc.dynamicDescription}</span></span>
                </div>
              </div>

              {scenario === 'gameai' && (
                <div className="flex items-center gap-2 justify-center overflow-x-auto max-w-full" style={{ scrollbarWidth: 'none' }}>
                  {GAME_AI_BOARDS.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => sim.requestBoardChange(id, sim.status, sim.isCurrentSaved)}
                      disabled={sim.isComputing || sim.isGraphLoading}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${sim.gameBoard === id
                        ? activeTabClass
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                        }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {(scenario === 'traffic' || scenario === 'evacuation' || scenario === 'robotics' || scenario === 'network') && (
                <div className="flex items-center gap-2 justify-center overflow-x-auto max-w-full" style={{ scrollbarWidth: 'none' }}>
                  {MAP_REGISTRY[scenario]?.map(mapDef => (
                    <button
                      key={mapDef.id}
                      onClick={() => sim.requestMapChange(mapDef.id, sim.status, sim.isCurrentSaved)}
                      disabled={sim.isComputing || sim.isGraphLoading}
                      className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${sim.mapId === mapDef.id
                        ? activeTabClass
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-600'
                        }`}
                    >
                      {mapDef.label}
                    </button>
                  ))}
                </div>
              )}

              <div data-tutorial="tutorial-scenario-selectors" className="w-full flex flex-col items-center gap-1.5 shrink-0 empty:hidden">
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
                              .filter(n => !sim.destinationDevices.includes(n.id))
                              .sort((a, b) => a.label.localeCompare(b.label))
                              .map(n => <option key={`src-${n.id}`} value={n.id}>{n.label.replace('\n', ' - ')}</option>)}
                          </select>
                        </div>

                        <div className="text-gray-500 hidden md:block">→</div>

                        <div className="flex items-center gap-2 relative">
                          <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold">Dst:</span>
                          <div
                            className={`bg-gray-800 border ${sim.destinationDevices.length > 0 ? 'border-red-900' : 'border-red-500'} rounded text-xs font-bold text-white px-2 py-1 flex items-center justify-between min-w-[120px] max-w-[150px] ${(sim.isComputing || sim.status === 'running') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-red-500'}`}
                            onClick={() => { if (!sim.isComputing && sim.status !== 'running') setDstDropdownOpen(o => !o); }}
                          >
                            <span className="truncate">{sim.destinationDevices.length > 0 ? `${sim.destinationDevices.length} Selected` : 'Select Dst...'}</span>
                            <span className="text-[10px] ml-2">▼</span>
                          </div>

                          {dstDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={() => { setDstDropdownOpen(false); setDstMinWarning(false); }}></div>
                              <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-xl z-50 min-w-[200px] max-h-[300px] overflow-y-auto">
                                {dstMinWarning && (
                                  <div className="sticky top-0 z-10 mx-0 px-3 py-2.5 bg-amber-950 border-b border-amber-500/60 flex items-start gap-2">
                                    <span className="text-amber-400 text-sm shrink-0 mt-0.5">⚠️</span>
                                    <div>
                                      <p className="text-amber-300 text-[11px] font-bold leading-tight">Minimum 2 Destinations Required</p>
                                      <p className="text-amber-400/70 text-[10px] mt-0.5 leading-tight">Device-to-Device mode needs at least 2 destinations.</p>
                                    </div>
                                  </div>
                                )}
                                {sim.currentGraph.nodes
                                  .filter(n => sim.mapId === 'campus' ? n.type === 'access_point' : (n.type === 'access_point' || n.type === 'server'))
                                  .filter(n => n.id !== sim.sourceDevice)
                                  .sort((a, b) => a.label.localeCompare(b.label))
                                  .map(n => {
                                    const isChecked = sim.destinationDevices.includes(n.id);
                                    const atMin = sim.destinationDevices.length <= 2;
                                    return (
                                      <label key={`dst-${n.id}`} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          className="accent-red-500"
                                          checked={isChecked}
                                          onChange={() => { }}
                                          onClick={(e) => {
                                            if (isChecked && atMin) {
                                              e.preventDefault();
                                              setDstMinWarning(true);
                                              setTimeout(() => setDstMinWarning(false), 3000);
                                              return;
                                            }
                                            setDstMinWarning(false);
                                            if (isChecked) {
                                              sim.setDestinationDevices(sim.destinationDevices.filter(id => id !== n.id));
                                            } else {
                                              sim.setDestinationDevices([...sim.destinationDevices, n.id]);
                                            }
                                          }}
                                        />
                                        <span className="text-xs text-gray-200 whitespace-nowrap">{n.label.replace('\n', ' - ')}</span>
                                      </label>
                                    );
                                  })}
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
                        <span className="sm:hidden">🔥</span> STARTING POINT (SRC):
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

                {scenario === 'traffic' && sim.currentGraph && (
                  <div className="flex flex-col md:flex-row items-center gap-4 justify-center w-full mt-1 bg-gray-900/60 p-2 rounded-xl border border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1">
                        <span className="sm:hidden">📍</span> STARTING POINT:
                      </span>
                      <div className="flex items-center gap-2 relative">
                        <div
                          className="bg-gray-800 border border-emerald-800 rounded text-xs font-bold text-white px-3 py-1 flex items-center justify-between min-w-[200px] max-w-[250px] cursor-pointer hover:border-emerald-500 disabled:opacity-50"
                          onClick={() => { if (!sim.isComputing && sim.status !== 'running') setTrafSrcDropdownOpen(o => !o); }}
                        >
                          <span className="truncate">
                            {sim.trafficSourceId
                              ? (sim.currentGraph?.nodes.find(n => n.id === sim.trafficSourceId)?.label?.replace('\n', ' - ') || sim.trafficSourceId)
                              : (sim.currentGraph?.sourceId ? (sim.currentGraph?.nodes.find(n => n.id === sim.currentGraph?.sourceId)?.label?.replace('\n', ' - ') || sim.currentGraph?.sourceId) : 'Select Src...')}
                          </span>
                          <span className="text-[10px] ml-2">▼</span>
                        </div>

                        {trafSrcDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setTrafSrcDropdownOpen(false)}></div>
                            <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-xl z-50 min-w-[250px] max-w-[300px] max-h-[300px] overflow-y-auto flex flex-col">
                              <div className="sticky top-0 z-10 bg-gray-800 p-2 border-b border-gray-600">
                                <input
                                  type="text"
                                  placeholder="Search starting point..."
                                  value={trafSrcSearch}
                                  onChange={(e) => setTrafSrcSearch(e.target.value)}
                                  className="w-full bg-gray-900 border border-gray-600 rounded text-xs text-white px-2 py-1 outline-none focus:border-emerald-500"
                                  autoFocus
                                />
                              </div>
                              <div className="overflow-y-auto flex-1">
                                {sim.currentGraph.nodes
                                  .filter(n => n.type === 'intersection' || n.type === 'street' || n.type === 'origin' || n.type === 'highway')
                                  .filter(n => !sim.trafficDestinationIds.includes(n.id))
                                  .filter(n => (n.label || n.id).toLowerCase().includes(trafSrcSearch.toLowerCase()))
                                  .sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id))
                                  .map(n => (
                                    <div
                                      key={`traffic-src-${n.id}`}
                                      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-xs text-gray-200 select-none whitespace-nowrap"
                                      onClick={() => {
                                        sim.setTrafficSourceId(n.id);
                                        setTrafSrcDropdownOpen(false);
                                        setTrafSrcSearch('');
                                      }}
                                    >
                                      {n.label ? n.label.replace('\n', ' - ') : n.id}
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-red-400 font-bold flex items-center gap-1">
                        <span className="sm:hidden">🏁</span> DESTINATION:
                      </span>
                      <div className="flex items-center gap-2 relative">
                        <div
                          className={`bg-gray-800 border ${sim.trafficDestinationIds.length > 0 ? 'border-red-900' : 'border-red-500'} rounded text-xs font-bold text-white px-2 py-1 flex items-center justify-between min-w-[120px] max-w-[150px] ${(sim.isComputing || sim.status === 'running') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-red-500'}`}
                          onClick={() => { if (!sim.isComputing && sim.status !== 'running') setTrafDstDropdownOpen(o => !o); }}
                        >
                          <span className="truncate">{sim.trafficDestinationIds.length > 0 ? `${sim.trafficDestinationIds.length} Selected` : 'Select Dst...'}</span>
                          <span className="text-[10px] ml-2">▼</span>
                        </div>

                        {trafDstDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setTrafDstDropdownOpen(false)}></div>
                            <div className="absolute top-full right-0 mt-1 bg-gray-800 border border-gray-600 rounded shadow-xl z-50 min-w-[250px] max-w-[300px] max-h-[300px] overflow-y-auto flex flex-col">
                              <div className="sticky top-0 z-10 bg-gray-800 p-2 border-b border-gray-600">
                                <input
                                  type="text"
                                  placeholder="Search destinations..."
                                  value={trafDstSearch}
                                  onChange={(e) => setTrafDstSearch(e.target.value)}
                                  className="w-full bg-gray-900 border border-gray-600 rounded text-xs text-white px-2 py-1 outline-none focus:border-red-500"
                                  autoFocus
                                />
                              </div>
                              <div className="overflow-y-auto flex-1">
                                {sim.currentGraph.nodes
                                  .filter(n => n.type === 'intersection' || n.type === 'street' || n.type === 'origin' || n.type === 'highway')
                                  .filter(n => n.id !== sim.trafficSourceId)
                                  .filter(n => (n.label || n.id).toLowerCase().includes(trafDstSearch.toLowerCase()))
                                  .sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id))
                                  .map(n => {
                                    const isChecked = sim.trafficDestinationIds.includes(n.id);
                                    return (
                                      <label key={`traf-dst-${n.id}`} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 cursor-pointer select-none">
                                        <input
                                          type="checkbox"
                                          className="accent-red-500"
                                          checked={isChecked}
                                          onChange={() => { }}
                                          onClick={() => {
                                            if (isChecked) {
                                              sim.setTrafficDestinationIds(sim.trafficDestinationIds.filter(id => id !== n.id));
                                            } else {
                                              sim.setTrafficDestinationIds([...sim.trafficDestinationIds, n.id]);
                                            }
                                          }}
                                        />
                                        <span className="text-xs text-gray-200 whitespace-nowrap">{n.label ? n.label.replace('\n', ' - ') : n.id}</span>
                                      </label>
                                    );
                                  })}
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    {(sim.trafficSourceId || sim.trafficDestinationIds.length > 0) && (
                      <button
                        onClick={() => { sim.setTrafficSourceId(null); sim.setTrafficDestinationIds([]); }}
                        disabled={sim.isComputing || sim.status === 'running'}
                        className="text-[11px] text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 border border-gray-600 px-2 py-1 rounded cursor-pointer transition-colors"
                        title="Reset to default endpoints"
                      >
                        Reset Default
                      </button>
                    )}
                  </div>
                )}

                {scenario === 'gameai' && sim.currentGraph && (
                  <div className="flex flex-col md:flex-row items-center gap-2 justify-center w-full mt-1 bg-gray-900/60 p-2 rounded-xl border border-gray-700/50">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1">
                        <span className="sm:hidden">📍</span> STRATEGY START:
                      </span>
                      <select
                        value={sim.gameAISourceId || ''}
                        onChange={(e) => sim.setGameAISourceId(e.target.value || null)}
                        disabled={sim.isComputing || sim.status === 'running'}
                        className="bg-gray-800 border border-purple-800 rounded text-xs font-bold text-white px-3 py-1 outline-none focus:border-purple-500 cursor-pointer disabled:opacity-50 max-w-[200px] truncate"
                      >
                        <option value="">Default (Random)</option>
                        {sim.currentGraph.nodes
                          .filter(n => n.type === 'board_tile' && (n.id.endsWith('1') || n.id.match(/^[a-z]+1$/)))
                          .sort((a, b) => (a.label || a.id).localeCompare(b.label || b.id))
                          .map(n => (
                            <option key={`gameai-src-${n.id}`} value={n.id}>
                              {n.label ? n.label.replace('\n', ' - ') : n.id}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Canvas */}
            <div
              data-tutorial="tutorial-canvas"
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
                      if (sim.isEvacuationRealWorld && !sim.isComputing) {
                        const node = sim.currentGraph?.nodes.find(n => n.id === nodeId);
                        if (node && (node.type === 'place' || node.type === 'origin' || node.type === 'room')) {
                          sim.setEvacuationSourceId(prev => prev === nodeId ? null : nodeId);
                        }
                      }
                      if (scenario === 'traffic' && !sim.isComputing && sim.status !== 'running') {
                        const node = sim.currentGraph?.nodes.find(n => n.id === nodeId);
                        if (node && (node.type === 'intersection' || node.type === 'street' || node.type === 'origin' || node.type === 'highway')) {
                          if (sim.trafficSourceId === nodeId) {
                            sim.setTrafficSourceId(null);
                          } else if (sim.trafficDestinationIds.includes(nodeId)) {
                            sim.setTrafficDestinationIds(sim.trafficDestinationIds.filter(id => id !== nodeId));
                          } else {
                            if (!sim.trafficSourceId) {
                              sim.setTrafficSourceId(nodeId);
                            } else {
                              sim.setTrafficDestinationIds([...sim.trafficDestinationIds, nodeId]);
                            }
                          }
                        }
                      }
                      if (scenario === 'gameai' && !sim.isComputing && sim.status !== 'running') {
                        const node = sim.currentGraph?.nodes.find(n => n.id === nodeId);
                        if (node && node.type === 'board_tile' && (nodeId.endsWith('1') || nodeId.match(/^[a-z]+1$/))) {
                          sim.setGameAISourceId(prev => prev === nodeId ? null : nodeId);
                        }
                      }
                    }}
                    mapId={sim.mapId}
                    shelfBoxCounts={sim.shelfBoxCounts}
                    robotAssignments={sim.robotAssignments}
                    activeAlgorithms={sim.activeAlgorithms}
                  />

                  {scenario === 'network' && (sim.mapId === 'companybusiness' || sim.mapId === 'campus') && highlightedNodeId && (
                    <CiscoTerminal nodeId={highlightedNodeId} onClose={() => setHighlightedNodeId(null)} />
                  )}

                  {scenario === 'network' && (sim.mapId === 'companybusiness' || sim.mapId === 'campus') && (
                    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-2">
                      {sim.currentGraph.nodes
                        .filter(n => ['mlt_sw1', 'main_router', 'college_router', 'hostel_router'].includes(n.id))
                        .map(n => (
                          <button
                            key={`terminal-btn-${n.id}`}
                            onClick={(e) => { e.stopPropagation(); setHighlightedNodeId(prev => prev === n.id ? null : n.id); }}
                            className={`px-3 py-1.5 rounded border font-mono text-xs shadow-md flex items-center gap-2 transition-colors cursor-pointer ${highlightedNodeId === n.id
                              ? 'bg-gray-800 border-green-500 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                              : 'bg-gray-900 border-gray-700 text-gray-400 hover:bg-gray-800 hover:text-gray-200'
                              }`}
                          >

                            {n.label ? n.label.split('\n')[0] : n.id} Terminal
                          </button>
                        ))}
                    </div>
                  )}

                  {sim.isGraphLoading && (
                    <div className="absolute inset-0 bg-[#0a0f1e]/40 backdrop-blur-[2px] flex flex-col items-center justify-center text-white gap-3 z-50 transition-all">
                      <div className="w-8 h-8 border-4 border-gray-600 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-sm font-mono tracking-wider font-bold shadow-black drop-shadow-md">Resyncing Map...</span>
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

            {/* Playback Controls */}
            <div data-tutorial="tutorial-playback-controls" className="mt-2 flex flex-col items-center gap-3 w-full shrink-0">
              <div className="flex items-center gap-2 flex-wrap justify-center w-full">
                <button onClick={sim.handleRerollEvents} disabled={sim.status === 'running'} className={scenarioBtnClass}>Reroll Events</button>
                <button disabled={sim.isComputing || sim.isGraphLoading} onClick={() => sim.requestReset(sim.handleReset, sim.status)} className={scenarioBtnClass}>Reset</button>
                <button disabled={sim.isComputing || sim.isGraphLoading || sim.stepIndex === 0} onClick={sim.handleStepBackward} className={scenarioBtnClass}>Back</button>

                {sim.status === 'running' ? (
                  <button disabled={sim.isComputing || sim.isGraphLoading} onClick={sim.handlePause} className={`${primaryBtnClass} hover:bg-red-500 bg-red-600 text-white shadow-red-900/40`}>Pause</button>
                ) : sim.status === 'paused' ? (
                  <button disabled={sim.isComputing || sim.isGraphLoading} onClick={sim.handleResume} className={`${primaryBtnClass} hover:bg-green-500 bg-green-600 text-white shadow-green-900/40`}>Resume</button>
                ) : sim.status === 'done' ? (
                  <button disabled={sim.isComputing || sim.isGraphLoading} onClick={sim.handleRun} className={`${primaryBtnClass} hover:bg-blue-500 bg-blue-600 text-white shadow-blue-900/40`}>Replay</button>
                ) : (
                  <button disabled={sim.isComputing || sim.isGraphLoading} onClick={sim.handleRun} className={`${primaryBtnClass} w-full sm:w-auto hover:bg-green-500 bg-green-600 text-white shadow-green-900/40`}>
                    {sim.isComputing ? 'Computing...' : 'Run Simulations'}
                  </button>
                )}

                <button disabled={sim.isComputing || sim.isGraphLoading || sim.stepIndex >= sim.totalSteps} onClick={sim.handleStepForward} className={scenarioBtnClass}>Fwd</button>
                <button disabled={sim.isComputing || sim.isGraphLoading} onClick={() => sim.requestSkip(sim.handleSkipEnd, sim.status)} className={scenarioBtnClass}>Skip</button>
              </div>

              {/* Speed Controller */}
              <SpeedController
                playbackSpeed={sim.playbackSpeed}
                handleSpeedChange={sim.handleSpeedChange}
                scenario={scenario}
              />
            </div>
          </main>

          {/* ── Right Sidebar: Reports / Events / Panels ──────────────────────── */}
          <ResizableSidebar
            side="right"
            storageKey="sim_right_panel"
            defaultWidth={360}
            minWidth={300}
            maxWidth={480}
            className="border-t lg:border-t-0 lg:border-l border-white/5 lg:max-h-[calc(100vh-theme(spacing.20))] bg-[#0a0f1e]/50 backdrop-blur-sm"
            innerClassName="p-4 flex flex-col gap-4"
          >
            {isExpertMode && (
              <div className="shrink-0">
                <ExpertModePanel activeSteps={sim.activeSteps} activeAlgorithms={sim.activeAlgorithms} />
              </div>
            )}

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
                  activeAlgorithms={sim.activeAlgorithms}
                />
              </div>
            )}

            <div className="shrink-0" data-tutorial="tutorial-map-events">
              <DynamicMapEvents
                dynamicEvents={sim.simResults?.hybrid.dynamicEvents || []}
                stepIndex={sim.stepIndex}
                simResults={sim.simResults}
                scenario={scenario}
                onEventClick={handleEventClick}
                highlightedNodeId={highlightedNodeId}
                activeAlgorithms={sim.activeAlgorithms}
              />
            </div>

            {scenario === 'robotics' && sim.currentGraph && (
              <div data-tutorial="tutorial-scenario-panels" className="flex flex-col gap-4 shrink-0 w-full">
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
              </div>
            )}

            {sim.mapId === 'campus' && scenario === 'network' && (
              <div data-tutorial="tutorial-scenario-panels" className="shrink-0 bg-gray-900 border border-indigo-900/50 rounded-xl p-4 flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
                <div className="text-[10px] uppercase tracking-[0.2em] text-indigo-400 font-bold mb-1">Campus Topology Rules</div>
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
              <div data-tutorial="tutorial-scenario-panels" className="shrink-0">
                <StrategyMapEvents
                  dynamicEvents={sim.simResults?.hybrid.dynamicEvents || []}
                  stepIndex={sim.stepIndex}
                  simResults={sim.simResults}
                />
              </div>
            )}

            {/* Synthetic Size Adjuster */}
            {sim.mapId === 'synthetic' && (
              <div data-tutorial="tutorial-size-adjuster" className="shrink-0 glass-panel rounded-xl p-4 flex flex-col gap-2 fade-in hover:shadow-glow-blue transition-shadow duration-500">
                <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-bold mb-1">Dynamic Size Adjuster</div>

                <div className="flex items-center justify-between gap-2">
                  {/* Nodes */}
                  <label className="flex items-center gap-1.5 flex-1 rounded-md border border-white/10 bg-black/40 shadow-inner pl-3 pr-0 py-1 overflow-hidden transition-colors focus-within:border-teal-500">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex-1">Nodes</span>
                    <div className="flex items-stretch bg-black/60 border-l border-white/10 h-full ml-1">
                      <input
                        type="number"
                        min={MIN_SYNTHETIC_NODES[sim.sizingKey as SizingKey]}
                        max={MAX_SYNTHETIC_NODES[sim.sizingKey as SizingKey]}
                        value={sim.localNodesInput}
                        onChange={(e) => sim.setLocalNodesInput(e.target.value)}
                        onBlur={() => { if (sim.localNodesInput !== '') sim.requestSizingChange('nodes', Number(sim.localNodesInput), sim.status, sim.isCurrentSaved); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && sim.localNodesInput !== '') { sim.requestSizingChange('nodes', Number(sim.localNodesInput), sim.status, sim.isCurrentSaved); (e.target as HTMLInputElement).blur(); } }}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        className="w-10 bg-transparent py-1 text-center text-xs font-bold text-teal-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 m-0"
                      />
                      <div className="flex flex-col border-l border-white/10 bg-black/40 w-5">
                        <button type="button" disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.nodes >= MAX_SYNTHETIC_NODES[sim.sizingKey as SizingKey]} onClick={() => sim.requestSizingStep('nodesUp', sim.status, sim.isCurrentSaved)} className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button type="button" disabled={sim.isComputing || sim.isGraphLoading || sim.syntheticSizing.nodes <= MIN_SYNTHETIC_NODES[sim.sizingKey as SizingKey]} onClick={() => sim.requestSizingStep('nodesDown', sim.status, sim.isCurrentSaved)} className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 border-t border-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  </label>

                  {/* Links */}
                  <label className="flex items-center gap-1.5 flex-1 rounded-md border border-white/10 bg-black/40 shadow-inner pl-3 pr-0 py-1 overflow-hidden transition-colors focus-within:border-teal-500">
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold flex-1">Links</span>
                    <div className="flex items-stretch bg-black/60 border-l border-white/10 h-full ml-1">
                      <input
                        type="number"
                        min={MIN_SYNTHETIC_LINKS[scenario]}
                        max={1600}
                        value={sim.localEdgesInput}
                        onChange={(e) => sim.setLocalEdgesInput(e.target.value)}
                        onBlur={() => { if (sim.localEdgesInput !== '') sim.requestSizingChange('edges', Math.max(MIN_SYNTHETIC_LINKS[scenario], Number(sim.localEdgesInput)), sim.status, sim.isCurrentSaved); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' && sim.localEdgesInput !== '') { sim.requestSizingChange('edges', Math.max(MIN_SYNTHETIC_LINKS[scenario], Number(sim.localEdgesInput)), sim.status, sim.isCurrentSaved); (e.target as HTMLInputElement).blur(); } }}
                        disabled={sim.isComputing || sim.isGraphLoading}
                        className="w-10 bg-transparent py-1 text-center text-xs font-bold text-teal-300 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50 m-0"
                      />
                      <div className="flex flex-col border-l border-white/10 bg-black/40 w-5">
                        <button type="button" disabled={sim.isComputing || sim.isGraphLoading || sim.generatedEdgeCount >= 1600} onClick={() => sim.requestSizingStep('edgesUp', sim.status, sim.isCurrentSaved)} className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
                        </button>
                        <button type="button" disabled={sim.isComputing || sim.isGraphLoading || sim.generatedEdgeCount <= MIN_SYNTHETIC_LINKS[scenario]} onClick={() => sim.requestSizingStep('edgesDown', sim.status, sim.isCurrentSaved)} className="flex-1 text-gray-400 hover:text-white hover:bg-gray-700 border-t border-gray-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center justify-center">
                          <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                      </div>
                    </div>
                  </label>
                </div>

                <div className="text-center mt-1 text-[9px] text-gray-500 tracking-wider">
                  Generated: {sim.generatedNodeCount} nodes / {sim.generatedEdgeCount} links
                </div>
              </div>
            )}
          </ResizableSidebar>
        </div>
      </div>

      {/* ── History Modal ──────────────────────────────────────────────────────── */}
      <HistoryModal
        isOpen={sim.isHistoryModalOpen}
        onClose={() => sim.setIsHistoryModalOpen(false)}
        history={sim.history}
        scenario={scenario}
        onDeleteHistory={sim.handleDeleteHistory}
        onImportHistory={sim.handleImportHistory}
        activeAlgorithms={sim.activeAlgorithms}
      />

      {/* ── Save Result Modal ──────────────────────────────────────────────────── */}
      {sim.isSaveModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 transition-opacity">
          <div className="bg-gray-900 border border-gray-700 rounded-xl w-full max-w-md flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-2">💾 Save Result to History</h3>
              <p className="text-sm text-gray-400 mb-5">Enter a custom name for this simulation run to easily identify it later.</p>
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
              <button onClick={() => sim.setIsSaveModalOpen(false)} className="px-5 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-sm transition-all cursor-pointer">Cancel</button>
              <button onClick={() => sim.confirmSaveResult()} disabled={sim.isCurrentSaved || sim.isComputing} className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] cursor-pointer">Save Result</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
