import React from 'react';
import { HistoryEntry, HistoryResults } from '../types';
import { useTheme } from '../../../context/ThemeContext';

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
  entry, allEvents, currentStep,
  highlightedNodeId, blockIcon, clearIcon, onEventClick, onSeek,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const visibleEvents = allEvents.filter(e => e.stepIndex <= currentStep).reverse();

  return (
    <div className={`rounded-xl p-4 text-xs space-y-2 border transition-colors ${
      isLight ? 'bg-white border-slate-200 shadow-sm text-slate-700' : 'bg-gray-900/40 border-gray-800 text-gray-400'
    }`}>
      <span className={`font-extrabold block uppercase text-[10px] tracking-wider ${
        isLight ? 'text-amber-800' : 'text-orange-400'
      }`}>
        Structural Metadata
      </span>
      <p>
        Graph composed of{' '}
        <strong className={isLight ? 'text-slate-900 font-extrabold' : 'text-white font-bold'}>{entry.totalNodes || 0} nodes</strong> and{' '}
        <strong className={isLight ? 'text-slate-900 font-extrabold' : 'text-white font-bold'}>{entry.metadata?.syntheticSizing?.edges || 0} edges</strong>.
        Baseline optimal path:{' '}
        <strong className={isLight ? 'text-slate-900 font-extrabold' : 'text-white font-bold'}>{entry.optimalPathLength || 0} distance units</strong>.
      </p>

      {allEvents.length > 0 && (
        <div className={`mt-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-gray-800/50'}`}>
          <span className={`font-extrabold block text-[10px] uppercase tracking-wider mb-2 ${
            isLight ? 'text-amber-800' : 'text-orange-400'
          }`}>
            Dynamic Blockages ({visibleEvents.length})
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
                      ? isLight
                        ? 'border-amber-400 bg-amber-100/70 text-amber-950 shadow-xs scale-[1.01] font-bold'
                        : 'border-yellow-400 bg-yellow-900/20 shadow-[0_0_8px_rgba(234,179,8,0.35)] scale-[1.01]'
                      : event.blocked
                        ? isLight
                          ? 'border-amber-300 bg-amber-50 text-amber-900 hover:border-amber-400'
                          : 'border-orange-500/30 bg-orange-900/10 text-orange-300 hover:border-orange-400/60'
                        : isLight
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:border-emerald-400'
                          : 'border-green-500/30 bg-green-900/10 text-green-300 hover:border-green-400/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`text-[10px] font-mono shrink-0 ${isLight ? 'opacity-70 font-bold' : 'opacity-60'}`}>[{event.stepIndex}]</span>
                    <span className="text-[10px] shrink-0">{event.blocked ? blockIcon : clearIcon}</span>
                    <span className="truncate flex-1 font-bold">{event.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
