import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AlgorithmStep } from '../../types';

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
}

type AlgoKey = 'bfs' | 'dfs' | 'hybrid';

const ALGO_META: Record<
  AlgoKey,
  { label: string; tab: string; text: string; border: string; chip: string }
> = {
  bfs: {
    label: 'BFS',
    tab: 'bg-green-500/20 text-green-300 border-green-500/50',
    text: 'text-green-400',
    border: 'border-green-500',
    chip: 'border-green-500/40 text-green-200',
  },
  dfs: {
    label: 'DFS',
    tab: 'bg-purple-500/20 text-purple-300 border-purple-500/50',
    text: 'text-purple-400',
    border: 'border-purple-500',
    chip: 'border-purple-500/40 text-purple-200',
  },
  hybrid: {
    label: 'Hybrid',
    tab: 'bg-orange-500/20 text-orange-300 border-orange-500/50',
    text: 'text-orange-400',
    border: 'border-orange-500',
    chip: 'border-orange-500/40 text-orange-200',
  },
};

export const ExpertModePanel: React.FC<ExpertModePanelProps> = ({ activeSteps, activeAlgorithms }) => {
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
  const meta = ALGO_META[selected];
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

  return (
    <div className="bg-[#0a0f1e] border border-gray-700/50 rounded-xl p-4 flex flex-col gap-3 font-mono shadow-[0_0_15px_rgba(0,0,0,0.3)]">
      {/* Header + algorithm tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-gray-400 font-bold text-sm">{'>_'}</span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-gray-300 font-bold truncate">
            Algorithm Path Trace
          </span>
        </div>

        <div className="flex bg-gray-900/70 border border-gray-700/60 rounded-lg p-0.5 shrink-0">
          {availableKeys.map(k => {
            const isActive = k === selected;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setSelected(k)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md border transition-colors ${isActive
                  ? ALGO_META[k].tab
                  : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
              >
                {ALGO_META[k].label}
              </button>
            );
          })}
        </div>
      </div>

      {availableKeys.length === 0 || !step ? (
        <div className="text-gray-500 italic text-center py-4 text-[10px]">
          Waiting for simulation logs...
        </div>
      ) : (
        <div className={`border-t-2 ${meta.border} bg-gray-900/30 rounded-b p-2.5 flex flex-col gap-2 text-[10px]`}>
          {/* Current node + phase */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-gray-500">Evaluating:</span>
              <span className="text-white font-medium truncate">{step.current || 'None'}</span>
            </div>
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <span className="text-gray-500">Nodes in path</span>
              <span className={`font-bold ${meta.text}`}>{path.length}</span>
            </div>
          </div>

          {step.phaseLabel && (
            <div className="text-gray-400 border-t border-gray-800/60 pt-1.5 break-words">
              {step.phaseLabel}
            </div>
          )}

          {/* Scrollable full path trace */}
          <div className="border-t border-gray-800/60 pt-1.5">
            <div className="text-gray-500 mb-1">Path trace:</div>
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="max-h-[28vh] overflow-y-auto pr-1 custom-scrollbar"
            >
              {path.length === 0 ? (
                <span className="text-gray-500 italic">Starting...</span>
              ) : (
                <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5">
                  {path.map((node, i) => (
                    <React.Fragment key={`${node}-${i}`}>
                      <span
                        className={`px-1.5 py-0.5 rounded border bg-gray-950/60 ${meta.chip} ${i === path.length - 1 ? 'ring-1 ring-white/40 text-white' : ''
                          }`}
                        title={`Step ${i + 1}`}
                      >
                        <span className="text-gray-500 mr-1">{i + 1}.</span>
                        {node}
                      </span>
                      {i < path.length - 1 && <span className="text-gray-600">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};