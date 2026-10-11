import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmStep } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface ExpertModePanelProps {
  activeSteps: {
    bfs?: AlgorithmStep | null;
    dfs?: AlgorithmStep | null;
    hybrid?: AlgorithmStep | null;
  };
  activeAlgorithms: {
    bfs: boolean;
    dfs: boolean;
    hybrid: boolean;
  };
  isFinished?: boolean;
  showHopBadges?: boolean;
  onToggleHopBadges?: () => void;
  highlightedNodeId?: string | null;
  onNodeClick?: (nodeId: string) => void;
  getNodeLabel?: (nodeId: string) => string;
}

type AlgoKey = 'bfs' | 'dfs' | 'hybrid';

interface AlgoThemeStyle {
  label: string;
  tabActive: {
    light: string;
    dark: string;
  };
  text: {
    light: string;
    dark: string;
  };
  border: {
    light: string;
    dark: string;
  };
  dot: {
    light: string;
    dark: string;
  };
  hopsCardSelected: {
    light: string;
    dark: string;
  };
  chipNormal: {
    light: string;
    dark: string;
  };
  chipLast: {
    light: string;
    dark: string;
  };
}

const ALGO_THEMES: Record<AlgoKey, AlgoThemeStyle> = {
  bfs: {
    label: 'BFS',
    tabActive: {
      light: 'bg-emerald-100 text-emerald-800 border-emerald-400 font-bold shadow-xs',
      dark: 'bg-green-500/20 text-green-300 border-green-500/50 font-bold',
    },
    text: {
      light: 'text-emerald-700',
      dark: 'text-green-400',
    },
    border: {
      light: 'border-emerald-500',
      dark: 'border-green-500',
    },
    dot: {
      light: 'bg-emerald-500',
      dark: 'bg-green-400',
    },
    hopsCardSelected: {
      light: 'bg-emerald-100/90 text-emerald-950 border-emerald-400 ring-2 ring-emerald-400/40 font-bold shadow-xs',
      dark: 'bg-green-500/20 text-green-300 border-green-500/50 ring-1 ring-white/30',
    },
    chipNormal: {
      light: 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-xs',
      dark: 'bg-gray-900/90 text-green-300 border-green-500/40 hover:bg-green-950/60 hover:border-green-400',
    },
    chipLast: {
      light: 'bg-emerald-100 text-emerald-900 border-emerald-500 ring-2 ring-emerald-400/40 font-bold shadow-xs hover:bg-emerald-200/70',
      dark: 'bg-green-950/80 text-white border-green-400 ring-1 ring-white/40 font-bold hover:bg-green-900/60',
    },
  },
  dfs: {
    label: 'DFS',
    tabActive: {
      light: 'bg-purple-100 text-purple-800 border-purple-400 font-bold shadow-xs',
      dark: 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-bold',
    },
    text: {
      light: 'text-purple-700',
      dark: 'text-purple-400',
    },
    border: {
      light: 'border-purple-500',
      dark: 'border-purple-500',
    },
    dot: {
      light: 'bg-purple-500',
      dark: 'bg-purple-400',
    },
    hopsCardSelected: {
      light: 'bg-purple-100/90 text-purple-950 border-purple-400 ring-2 ring-purple-400/40 font-bold shadow-xs',
      dark: 'bg-purple-500/20 text-purple-300 border-purple-500/50 ring-1 ring-white/30',
    },
    chipNormal: {
      light: 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100 hover:border-purple-400 hover:shadow-xs',
      dark: 'bg-gray-900/90 text-purple-300 border-purple-500/40 hover:bg-purple-950/60 hover:border-purple-400',
    },
    chipLast: {
      light: 'bg-purple-100 text-purple-900 border-purple-500 ring-2 ring-purple-400/40 font-bold shadow-xs hover:bg-purple-200/70',
      dark: 'bg-purple-950/80 text-white border-purple-400 ring-1 ring-white/40 font-bold hover:bg-purple-900/60',
    },
  },
  hybrid: {
    label: 'Hybrid',
    tabActive: {
      light: 'bg-amber-100 text-amber-900 border-amber-400 font-bold shadow-xs',
      dark: 'bg-orange-500/20 text-orange-300 border-orange-500/50 font-bold',
    },
    text: {
      light: 'text-amber-800',
      dark: 'text-orange-400',
    },
    border: {
      light: 'border-amber-500',
      dark: 'border-orange-500',
    },
    dot: {
      light: 'bg-amber-500',
      dark: 'bg-orange-400',
    },
    hopsCardSelected: {
      light: 'bg-amber-100/90 text-amber-950 border-amber-400 ring-2 ring-amber-400/40 font-bold shadow-xs',
      dark: 'bg-orange-500/20 text-orange-300 border-orange-500/50 ring-1 ring-white/30',
    },
    chipNormal: {
      light: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100 hover:border-amber-400 hover:shadow-xs',
      dark: 'bg-gray-900/90 text-orange-300 border-orange-500/40 hover:bg-orange-950/60 hover:border-orange-400',
    },
    chipLast: {
      light: 'bg-amber-100 text-amber-950 border-amber-500 ring-2 ring-amber-400/40 font-bold shadow-xs hover:bg-amber-200/70',
      dark: 'bg-orange-950/80 text-white border-orange-400 ring-1 ring-white/40 font-bold hover:bg-orange-900/60',
    },
  },
};

export const ExpertModePanel: React.FC<ExpertModePanelProps> = ({
  activeSteps,
  activeAlgorithms,
  isFinished,
  showHopBadges,
  onToggleHopBadges,
  highlightedNodeId,
  onNodeClick,
  getNodeLabel,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const availableKeys = useMemo(
    () => (['bfs', 'dfs', 'hybrid'] as AlgoKey[]).filter(k => activeAlgorithms[k]),
    [activeAlgorithms]
  );

  const [selected, setSelected] = useState<AlgoKey>(availableKeys[0] ?? 'bfs');

  // If the selected algorithm gets disabled, fall back to the first available one.
  useEffect(() => {
    if (availableKeys.length > 0 && !availableKeys.includes(selected)) {
      setSelected(availableKeys[0]);
    }
  }, [availableKeys, selected]);

  const step = activeSteps[selected] ?? null;
  const meta = ALGO_THEMES[selected];
  const path = step?.path ?? [];

  // Auto-scroll to the newest node, but only if the user is already near the bottom.
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 24;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickToBottom.current) el.scrollTop = el.scrollHeight;
  }, [path.length, selected]);

  // Reset scroll behavior when switching tabs.
  useEffect(() => {
    stickToBottom.current = true;
  }, [selected]);

  const getChipStyle = (node: string, isLast: boolean) => {
    const isHighlighted = highlightedNodeId === node;
    if (isHighlighted) {
      return isLight
        ? 'bg-yellow-100 text-yellow-950 border-yellow-500 ring-2 ring-yellow-400 font-bold shadow-md scale-105 z-10'
        : 'bg-yellow-950/90 text-yellow-200 border-yellow-400 ring-2 ring-yellow-400/80 font-bold shadow-[0_0_10px_rgba(250,204,21,0.5)] scale-105 z-10';
    }
    if (isLast) {
      return isLight ? meta.chipLast.light : meta.chipLast.dark;
    }
    return isLight ? meta.chipNormal.light : meta.chipNormal.dark;
  };

  return (
    <div
      data-tutorial="tutorial-expert-panel"
      className={`border rounded-xl p-4 flex flex-col gap-3 font-mono transition-colors ${
        isLight
          ? 'bg-white border-slate-200 text-slate-800 shadow-[0_4px_20px_rgba(0,0,0,0.05)]'
          : 'bg-[#0a0f1e] border-gray-700/50 text-white shadow-[0_0_15px_rgba(0,0,0,0.3)]'
      }`}
    >
      {/* Header + algorithm tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`text-[10px] uppercase tracking-[0.2em] font-bold ${
              isLight ? 'text-slate-700' : 'text-gray-300'
            }`}
          >
            Algorithm Path Trace
          </span>
        </div>

        <div
          className={`flex rounded-lg p-0.5 shrink-0 border ${
            isLight
              ? 'bg-slate-100 border-slate-200/90'
              : 'bg-gray-900/70 border-gray-700/60'
          }`}
        >
          {availableKeys.map(k => {
            const isActive = k === selected;
            const kMeta = ALGO_THEMES[k];
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(k)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md border transition-all cursor-pointer ${
                  isActive
                    ? isLight
                      ? kMeta.tabActive.light
                      : kMeta.tabActive.dark
                    : isLight
                      ? 'border-transparent text-slate-500 hover:text-slate-800'
                      : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                {kMeta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Final Path Completed Overview */}
      {isFinished && (
        <div
          className={`rounded-lg p-2.5 flex flex-col gap-2 border ${
            isLight
              ? 'bg-slate-50/80 border-slate-200'
              : 'bg-gray-950/70 border-gray-700/80'
          }`}
        >
          <div className="flex items-center justify-between text-[10px]">
            <span
              className={`font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-700' : 'text-gray-300'
              }`}
            >
              <span>🏁</span> Final Path Hops
            </span>
            {onToggleHopBadges && (
              <button
                type="button"
                onClick={onToggleHopBadges}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold transition-all cursor-pointer ${
                  showHopBadges
                    ? isLight
                      ? 'bg-cyan-100 text-cyan-900 border-cyan-400 shadow-xs hover:bg-cyan-200/80'
                      : 'bg-cyan-950/70 text-cyan-300 border-cyan-500/60 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                    : isLight
                      ? 'bg-slate-200/70 text-slate-600 border-slate-300 hover:text-slate-900 hover:bg-slate-200'
                      : 'bg-gray-900 text-gray-500 border-gray-700 hover:text-gray-300'
                }`}
                title="Toggle numbered hop badges on map"
              >
                <span>🏷️</span>
                <span>Map Hops: {showHopBadges ? 'ON' : 'OFF'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {availableKeys.map(k => {
              const p = activeSteps[k]?.path ?? [];
              const hops = p.length > 1 ? p.length - 1 : 0;
              const isSelected = k === selected;
              const kMeta = ALGO_THEMES[k];
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelected(k)}
                  className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-md border text-[10px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? kMeta.hopsCardSelected.light
                        : kMeta.hopsCardSelected.dark
                      : isLight
                        ? 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                        : 'bg-gray-900/60 text-gray-400 border-gray-800 hover:border-gray-700'
                  }`}
                  title={`View ${kMeta.label} Path Trace`}
                >
                  <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isLight ? kMeta.dot.light : kMeta.dot.dark
                      }`}
                    />
                    <span>{kMeta.label}</span>
                  </span>
                  <span
                    className={`text-xs mt-0.5 ${
                      isSelected
                        ? isLight
                          ? 'text-slate-950 font-extrabold'
                          : 'text-white font-extrabold'
                        : isLight
                          ? kMeta.text.light
                          : kMeta.text.dark
                    }`}
                  >
                    {hops} hops
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {availableKeys.length === 0 || !step ? (
        <div
          className={`italic text-center py-4 text-[10px] ${
            isLight ? 'text-slate-400' : 'text-gray-500'
          }`}
        >
          Waiting for simulation logs...
        </div>
      ) : (
        <div
          className={`border-t-2 rounded-b p-2.5 flex flex-col gap-2 text-[10px] ${
            isLight
              ? `${meta.border.light} bg-slate-50/70 border border-slate-200 text-slate-800`
              : `${meta.border.dark} bg-gray-900/30 text-white`
          }`}
        >
          {/* Current node + phase */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span
                className={`text-[9px] uppercase tracking-wider ${
                  isLight ? 'text-slate-500 font-semibold' : 'text-gray-500'
                }`}
              >
                Evaluating:
              </span>
              {step.current ? (
                <button
                  type="button"
                  onClick={() => onNodeClick?.(step.current!)}
                  title={`Click to zoom in on ${
                    getNodeLabel ? getNodeLabel(step.current) : step.current
                  }`}
                  className={`text-left font-bold truncate transition-colors cursor-pointer hover:underline ${
                    highlightedNodeId === step.current
                      ? isLight
                        ? 'text-yellow-700 underline'
                        : 'text-yellow-300 underline'
                      : isLight
                        ? 'text-slate-900 hover:text-blue-600'
                        : 'text-white hover:text-blue-300'
                  }`}
                >
                  {step.current}
                </button>
              ) : (
                <span className={`italic ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                  None
                </span>
              )}
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span
                className={`text-[9px] uppercase tracking-wider ${
                  isLight ? 'text-slate-500 font-semibold' : 'text-gray-500'
                }`}
              >
                Nodes in path
              </span>
              <span className={`font-bold ${isLight ? meta.text.light : meta.text.dark}`}>
                {path.length}
              </span>
            </div>
          </div>

          {step.phaseLabel && (
            <div
              className={`pt-1.5 break-words font-medium border-t ${
                isLight
                  ? 'text-slate-600 border-slate-200'
                  : 'text-gray-400 border-gray-800/60'
              }`}
            >
              {step.phaseLabel}
            </div>
          )}

          {/* Scrollable full path trace */}
          <div
            className={`pt-1.5 border-t ${
              isLight ? 'border-slate-200' : 'border-gray-800/60'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span
                className={`text-[10px] font-bold ${
                  isLight ? 'text-slate-700' : 'text-gray-400'
                }`}
              >
                Path trace:
              </span>
              <span
                className={`text-[9px] select-none ${
                  isLight ? 'text-slate-500' : 'text-gray-500'
                }`}
              >
                (click node to zoom)
              </span>
            </div>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[28vh] overflow-y-auto pr-1 custom-scrollbar"
            >
              {path.length === 0 ? (
                <span className={`italic ${isLight ? 'text-slate-400' : 'text-gray-500'}`}>
                  Starting...
                </span>
              ) : (
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
                  {path.map((node, i) => {
                    const isLast = i === path.length - 1;
                    const nodeDisplayName = getNodeLabel ? getNodeLabel(node) : node;
                    return (
                      <React.Fragment key={`${node}-${i}`}>
                        <button
                          type="button"
                          onClick={() => onNodeClick?.(node)}
                          className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer flex items-center shrink-0 text-[10px] select-none active:scale-95 ${getChipStyle(
                            node,
                            isLast
                          )}`}
                          title={`Click to zoom in on ${nodeDisplayName} (Hop ${i + 1})`}
                        >
                          <span
                            className={`mr-1 select-none ${
                              isLight ? 'text-slate-500 font-medium' : 'text-gray-500'
                            }`}
                          >
                            {i + 1}.
                          </span>
                          <span className="font-semibold">{node}</span>
                        </button>
                        {i < path.length - 1 && (
                          <span
                            className={`text-[10px] select-none font-medium ${
                              isLight ? 'text-slate-400' : 'text-gray-600'
                            }`}
                          >
                            →
                          </span>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};