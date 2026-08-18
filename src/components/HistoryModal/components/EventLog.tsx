import React from 'react';
import { HistoryEntry, HistoryResults } from '../types';
import { StrategyMapEvents } from '../../simulation/StrategyMapEvents';

interface Props {
  entry: HistoryEntry;
  results: HistoryResults;
  allEvents: any[];
  currentStep: number;
  maxEventStep: number;
  maxSteps: number;
  highlightedNodeId: string | null;
  blockIcon: string;
  clearIcon: string;
  onEventClick: (nodeId: string) => void;
  onSeek: (step: number) => void;
}

export const EventLog: React.FC<Props> = ({
  entry, results, allEvents, currentStep, maxEventStep, maxSteps,
  highlightedNodeId, blockIcon, clearIcon, onEventClick, onSeek,
}) => {
  const visibleEvents = allEvents.filter(e => e.stepIndex <= currentStep).reverse();

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-xs text-gray-400 space-y-2">
      <span className="font-bold text-gray-300 block uppercase text-[10px] tracking-wider text-orange-400">
        📌 Structural Metadata
      </span>
      <p>
        Graph composed of{' '}
        <strong className="text-white">{entry.totalNodes || 0} nodes</strong> and{' '}
        <strong className="text-white">{entry.metadata?.syntheticSizing?.edges || 0} edges</strong>.
        Baseline optimal path:{' '}
        <strong className="text-white">{entry.optimalPathLength || 0} distance units</strong>.
      </p>

      {allEvents.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-800/50">
          <span className="font-bold text-orange-400 block text-[10px] uppercase tracking-wider mb-2">
            ⚡ Dynamic Blockages ({visibleEvents.length})
          </span>
          <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {visibleEvents.map((event, idx) => {
              const isHighlighted = highlightedNodeId === event.nodeId;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    onEventClick(event.nodeId);
                    onSeek(event.stepIndex);
                  }}
                  title="Click to seek to this step and locate on map"
                  className={`flex items-start gap-2 p-2 rounded border cursor-pointer select-none transition-all ${
                    isHighlighted
                      ? 'border-yellow-400 bg-yellow-900/20 shadow-[0_0_8px_rgba(234,179,8,0.35)] scale-[1.01]'
                      : event.blocked
                        ? 'border-orange-500/30 bg-orange-900/10 text-orange-300 hover:border-orange-400/60'
                        : 'border-green-500/30 bg-green-900/10 text-green-300 hover:border-green-400/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[10px] font-mono opacity-60 shrink-0">[{event.stepIndex}]</span>
                    <span className="text-[10px] shrink-0">{event.blocked ? blockIcon : clearIcon}</span>
                    <span className="truncate flex-1 font-medium">{event.label}</span>
                  </div>
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
              bfs:    results.bfs    as any,
              dfs:    results.dfs    as any,
              hybrid: results.hybrid as any,
            }}
          />
        </div>
      )}
    </div>
  );
};
