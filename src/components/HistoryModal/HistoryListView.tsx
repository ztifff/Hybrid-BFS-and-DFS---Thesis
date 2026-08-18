import React from 'react';
import { HistoryEntry, SCENARIO_BADGES } from './types';

interface Props {
  filteredHistory: HistoryEntry[];
  selectedIds: Set<string>;
  toggleSelection: (id: string, e: React.MouseEvent) => void;
  onOpenDetail: (entry: HistoryEntry) => void;
  onDeleteOne: (id: string) => void;
}

export const HistoryListView: React.FC<Props> = ({
  filteredHistory, selectedIds, toggleSelection, onOpenDetail, onDeleteOne,
}) => {
  if (filteredHistory.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <span className="text-4xl mb-2">📁</span>
        <h4 className="text-gray-300 font-bold text-sm">No History Indexes Logged</h4>
        <p className="text-gray-500 text-xs mt-1 max-w-xs">
          Run algorithmic simulation cycles from your network control matrix dashboard to save benchmark logs here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredHistory.map(entry => {
        const isSelected = selectedIds.has(entry.id);
        const formattedDate =
          typeof entry.timestamp === 'string'
            ? new Date(entry.timestamp).toLocaleString()
            : entry.timestamp?.toLocaleString() || 'Unknown Date';

        return (
          <div
            key={entry.id}
            onClick={() => onOpenDetail(entry)}
            className={`group p-4 bg-gray-900/40 hover:bg-gray-900/80 border rounded-xl cursor-pointer transition-all relative flex flex-col justify-between h-36 shadow-lg ${
              isSelected ? 'border-red-500/50 bg-red-950/5' : 'border-gray-800/80 hover:border-gray-700'
            }`}
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <h3 className="font-bold text-white text-sm tracking-tight truncate max-w-[75%] group-hover:text-blue-400 transition-colors">
                  {entry.name}
                </h3>
                <span
                  className={`text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${
                    SCENARIO_BADGES[entry.scenario] || 'bg-gray-800 text-gray-400 border-gray-700'
                  }`}
                >
                  {entry.scenario}
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-500">{formattedDate}</p>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-800/50 mt-auto">
              <div className="flex items-center gap-3">
                <div
                  onClick={e => toggleSelection(entry.id, e)}
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-red-500/20 border-red-500 text-red-400'
                      : 'border-gray-700 group-hover:border-gray-500'
                  }`}
                >
                  {isSelected && <span className="text-[9px]">✓</span>}
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  Nodes: <strong className="text-gray-200">{entry.totalNodes || entry.simResult?.graph?.nodes?.length || 0}</strong>
                </span>
              </div>

              <button
                onClick={e => { e.stopPropagation(); onDeleteOne(entry.id); }}
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
  );
};
