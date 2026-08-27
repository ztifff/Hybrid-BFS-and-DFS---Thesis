import React, { useState, useEffect, useMemo } from 'react';
import { HistoryEntry, HistoryModalProps } from './types';
import { HistoryListView } from './HistoryListView';
import { HistoryDetailView } from './HistoryDetailView';
import { PurgeModal } from './components/PurgeModal';
import { ImportErrorModal } from './components/ImportErrorModal';
import { ImportSuccessModal } from './components/ImportSuccessModal';
import { useTutorial, TutorialOverlay, TutorialStep } from '../TutorialOverlay';

const HISTORY_TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: 'history-benchmarks',
    title: 'Execution Benchmarks',
    body: 'Displays the final performance metrics for each algorithm in this run, including total execution time, memory usage, and adaptability.',
    placement: 'auto',
  },
  {
    target: 'history-canvas-replay',
    title: 'Canvas Replay',
    body: 'Watch the entire simulation unfold again. You can scrub through the timeline at the bottom to see exact movements at any specific step.',
    placement: 'left',
  },
  {
    target: 'history-winner-card',
    title: 'Winner Card',
    body: 'Highlights the best performing algorithm based on a weighted score of distance, speed, and adaptability.',
    placement: 'auto',
  },
  {
    target: 'history-movements',
    title: 'Algorithm Movements',
    body: 'A breakdown of each algorithm\'s path length vs. total nodes visited. Helps visualize how efficient their search was.',
    placement: 'auto',
  },
  {
    target: 'history-barchart',
    title: 'Performance Chart',
    body: 'A visual comparison of key metrics like memory and execution time across all active algorithms.',
    placement: 'top',
  },
  {
    target: 'history-sim-config',
    title: 'Simulation Configuration',
    body: 'Shows the original parameters used for this run, such as the map, algorithm selection, and scenario-specific settings.',
    placement: 'top',
  },
  {
    target: 'history-event-log',
    title: 'Event Log',
    body: 'A timeline of all dynamic map events (like blockages or restorations) that occurred during this run, and which step they happened on.',
    placement: 'top',
  }
];

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen, onClose, history, scenario, onDeleteHistory, onImportHistory,
}) => {
  const [selectedIds, setSelectedIds]       = useState<Set<string>>(new Set());
  const [view, setView]                     = useState<'list' | 'detail'>('list');
  const [activeEntry, setActiveEntry]       = useState<HistoryEntry | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [historyTimelineStep, setHistoryTimelineStep] = useState<number>(-1);
  const [importError, setImportError]       = useState<{ expected: string; found: string } | null>(null);
  const [importSuccess, setImportSuccess]   = useState<{ count: number; scenario: string } | null>(null);
  const importInputRef = React.useRef<HTMLInputElement>(null);
  
  const tutorial = useTutorial('hybrid_sim_history_tutorial_v1', HISTORY_TUTORIAL_STEPS);

  // Reset all local state on close
  useEffect(() => {
    if (!isOpen) {
      setView('list');
      setActiveEntry(null);
      setSelectedIds(new Set());
      setIsPurgeModalOpen(false);
      setHighlightedNodeId(null);
      setHistoryTimelineStep(-1);
    }
  }, [isOpen]);

  // Reset timeline when opening a new entry
  useEffect(() => {
    setHistoryTimelineStep(-1);
  }, [activeEntry]);

  const filteredHistory = useMemo(() => {
    if (!scenario) return history;
    return history.filter(h => h.scenario === scenario);
  }, [history, scenario]);

  if (!isOpen) return null;

  // ── Selection helpers ──────────────────────────────────────────────────────
  const toggleSelection = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id); else next.add(id);
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

  // ── Export ─────────────────────────────────────────────────────────────────
  const buildExportFilename = (entries: HistoryEntry[]) => {
    const scenarioSlug = scenario ?? entries[0]?.scenario ?? 'simulation';
    const dateSlug = new Date().toISOString().slice(0, 10);
    return `multi-alg-${scenarioSlug}-${dateSlug}.json`;
  };

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

  // ── Import ─────────────────────────────────────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        const rawEntries: HistoryEntry[] = Array.isArray(parsed) ? parsed : [parsed];

        if (scenario) {
          const mismatched = rawEntries.filter(entry => entry.scenario && entry.scenario !== scenario);
          if (mismatched.length > 0) {
            setImportError({ expected: scenario, found: mismatched[0].scenario ?? 'unknown' });
            if (importInputRef.current) importInputRef.current.value = '';
            return;
          }
        }

        const entries: HistoryEntry[] = rawEntries.map(entry => ({
          ...entry,
          timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
          id: entry.id ?? Date.now().toString() + Math.random().toString(36).slice(2),
        }));

        if (entries.length > 0) {
          onImportHistory(entries);
          setImportSuccess({ count: entries.length, scenario: entries[0]?.scenario ?? scenario ?? 'simulation' });
        }
      } catch {
        alert('❌ Invalid file format. Please select a valid history JSON file.');
      }
      if (importInputRef.current) importInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-2xl w-full max-w-[1300px] h-[90vh] flex flex-col overflow-hidden shadow-glow-blue fade-in">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <header className="p-4 md:p-5 border-b border-gray-800 bg-[#0a0f1e]/60 flex flex-col md:flex-row md:justify-between md:items-center gap-4 relative">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pr-10">
            <h2 className="text-base md:text-lg font-bold text-white tracking-tight leading-tight">
              {view === 'list'
                ? <><span className="sm:hidden">🗄️ </span>Core Simulation Storage History</>
                : <><span className="sm:hidden">🔍 </span>Performance Inspect: {activeEntry?.name}</>}
            </h2>
            {view === 'list' && (
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full font-mono w-fit">
                {filteredHistory.length} entries
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 md:pr-10">
            {view === 'list' && (
              <>
                <input
                  ref={importInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportFile}
                />
                <button
                  onClick={() => importInputRef.current?.click()}
                  className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-1.5 bg-blue-900/30 hover:bg-blue-800/50 text-blue-300 hover:text-blue-200 border border-blue-700/30 hover:border-blue-600/50 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap"
                >
                  <span className="sm:hidden">📥 </span>Import
                </button>
                <button
                  onClick={() => setSelectedIds(
                    selectedIds.size === filteredHistory.length
                      ? new Set()
                      : new Set(filteredHistory.map(h => h.id))
                  )}
                  disabled={filteredHistory.length === 0}
                  className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {selectedIds.size === filteredHistory.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={handleExport}
                  disabled={filteredHistory.length === 0}
                  className="flex-1 sm:flex-none flex justify-center items-center gap-1.5 px-3 py-1.5 bg-emerald-900/30 hover:bg-emerald-800/50 text-emerald-300 hover:text-emerald-200 border border-emerald-700/30 hover:border-emerald-600/50 rounded-lg text-xs font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                  title={selectedIds.size > 0 ? `Export ${selectedIds.size} selected record(s)` : 'Export all records'}
                >
                  <span className="sm:hidden">📤 </span>{selectedIds.size > 0 ? `Export (${selectedIds.size})` : 'Export All'}
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="absolute top-4 md:top-5 right-4 md:right-5 text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all z-10 shrink-0"
          >
            ✕
          </button>
        </header>

        {/* ── Selection Action Bar ─────────────────────────────────────────── */}
        {view === 'list' && selectedIds.size > 0 && (
          <div className="bg-red-950/20 border-b border-red-900/40 px-6 py-3 flex justify-between items-center animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-red-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Flagged{' '}
              <strong className="font-mono bg-red-950 px-1.5 py-0.5 border border-red-800/40 rounded">
                {selectedIds.size}
              </strong>{' '}
              records for truncation.
            </div>
            <button
              onClick={() => setIsPurgeModalOpen(true)}
              className="px-3 py-1 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Purge Target Records
            </button>
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#060b16]">
          {view === 'list' ? (
            <HistoryListView
              filteredHistory={filteredHistory}
              selectedIds={selectedIds}
              toggleSelection={toggleSelection}
              onOpenDetail={handleOpenDetail}
              onDeleteOne={(id) => {
                setSelectedIds(new Set([id]));
                setIsPurgeModalOpen(true);
              }}
            />
          ) : (
            activeEntry && (
              <HistoryDetailView
                entry={activeEntry}
                historyTimelineStep={historyTimelineStep}
                highlightedNodeId={highlightedNodeId}
                onSeek={setHistoryTimelineStep}
                onHighlight={setHighlightedNodeId}
              />
            )
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <footer className="p-4 border-t border-gray-800 bg-[#0a0f1e]/40 flex justify-between items-center">
          <div>
            {view === 'detail' && (
              <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                Viewing Execution Pipeline:{' '}
                <strong className="text-gray-300 font-bold font-sans">{activeEntry?.name}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {view === 'detail' && (
              <>
                <button
                  onClick={() => tutorial.start()}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white border border-blue-500/30 hover:border-blue-500 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(37,99,235,0.2)]"
                >
                  Explain the Results
                </button>
                <button
                  onClick={() => setView('list')}
                  className="px-4 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl text-xs font-bold text-white transition-all cursor-pointer"
                >
                  ← Return to Index
                </button>
              </>
            )}
          </div>
        </footer>
      </div>

      {/* ── Overlay Modals ────────────────────────────────────────────────── */}
      {isPurgeModalOpen && (
        <PurgeModal
          count={selectedIds.size}
          onCancel={() => setIsPurgeModalOpen(false)}
          onConfirm={handleBulkDelete}
        />
      )}
      {importError && (
        <ImportErrorModal
          expected={importError.expected}
          found={importError.found}
          onClose={() => setImportError(null)}
        />
      )}
      {importSuccess && (
        <ImportSuccessModal
          count={importSuccess.count}
          scenario={importSuccess.scenario}
          onClose={() => setImportSuccess(null)}
        />
      )}

      {view === 'detail' && (
        <TutorialOverlay
          isOpen={tutorial.isOpen}
          stepIndex={tutorial.stepIndex}
          scenario={scenario || 'network'}
          steps={HISTORY_TUTORIAL_STEPS}
          onNext={tutorial.next}
          onPrev={tutorial.prev}
          onClose={tutorial.close}
          onGoTo={tutorial.goTo}
        />
      )}
    </div>
  );
};
