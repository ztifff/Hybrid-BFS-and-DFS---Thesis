import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CanvasControlsProps {
  // Zoom
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  // Floors
  isLayeredMap: boolean;
  activeFloor: string;
  setActiveFloor: (floor: string) => void;
  uniqueFloors?: string[];
  // Algorithm visibility
  visibleAlgos: { bfs: boolean; dfs: boolean; hybrid: boolean };
  toggleAlgo: (algo: 'bfs' | 'dfs' | 'hybrid') => void;
  // Follow algorithm
  followAlgo: 'bfs' | 'dfs' | 'hybrid' | null;
  setFollowAlgo: (algo: 'bfs' | 'dfs' | 'hybrid' | null) => void;
  // External algorithm active state (from header pills)
  activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean };
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom, zoomIn, zoomOut, resetZoom,
  isLayeredMap, activeFloor, setActiveFloor, uniqueFloors = [],
  visibleAlgos, toggleAlgo, followAlgo, setFollowAlgo,
  activeAlgorithms,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const visibleEnabledCount = (['bfs', 'dfs', 'hybrid'] as const).filter(
    algo => visibleAlgos[algo] && (activeAlgorithms ? activeAlgorithms[algo] : true),
  ).length;

  return (
    <>
      <div className="absolute top-3 left-3 z-20 flex flex-col items-center gap-1.5">
        <span className={`text-[8px] uppercase tracking-[0.18em] font-extrabold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Show</span>
        <div className={`flex items-center gap-1.5 rounded-full border px-2 py-1 backdrop-blur-sm shadow-lg ${isLight ? 'bg-white/90 border-slate-300' : 'bg-gray-900/85 border-gray-700'}`}>
          {(['bfs', 'dfs', 'hybrid'] as const).map((algo, index) => {
            const colors = { bfs: 'bg-green-500', dfs: 'bg-purple-500', hybrid: 'bg-orange-500' };
            const isEnabled = activeAlgorithms ? activeAlgorithms[algo] : true;
            const isVisible = visibleAlgos[algo];
            const isLastVisible = isVisible && isEnabled && visibleEnabledCount <= 1;
            const ring = { bfs: 'border-green-500', dfs: 'border-purple-500', hybrid: 'border-orange-500' }[algo];
            return <React.Fragment key={algo}>{index > 0 && <span className={`h-3 w-px ${isLight ? 'bg-slate-300' : 'bg-gray-700'}`} />}<button type="button" aria-label={`${isVisible ? 'Hide' : 'Show'} ${algo.toUpperCase()} on canvas`} aria-pressed={isVisible} title={!isEnabled ? `${algo.toUpperCase()} is disabled in the algorithm selector` : isLastVisible ? `At least one algorithm must stay visible` : `${isVisible ? 'Hide' : 'Show'} ${algo.toUpperCase()}`} disabled={!isEnabled || isLastVisible} onClick={() => toggleAlgo(algo)} className={`h-5 w-5 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${ring} ${isVisible && isEnabled ? colors[algo] : `${isLight ? 'bg-white' : 'bg-gray-950'} opacity-50`} ${isEnabled && !isLastVisible ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-30'}`} /></React.Fragment>;
          })}
        </div>
      </div>
      <div className="absolute top-3 right-3 z-20 flex flex-col items-center gap-1.5">
        <span className={`text-[8px] uppercase tracking-[0.18em] font-extrabold ${isLight ? 'text-slate-600' : 'text-gray-400'}`}>Follow</span>
        <div className={`flex items-center gap-1.5 rounded-full border px-2 py-1 backdrop-blur-sm shadow-lg ${isLight ? 'bg-white/90 border-slate-300' : 'bg-gray-900/85 border-gray-700'}`}>
          {(['bfs', 'dfs', 'hybrid'] as const).map((algo, index) => {
            const colors = { bfs: 'bg-green-500', dfs: 'bg-purple-500', hybrid: 'bg-orange-500' };
            const isEnabled = activeAlgorithms ? activeAlgorithms[algo] : true;
            const isFollowing = followAlgo === algo;
            const isVisible = visibleAlgos[algo];
            const ring = { bfs: 'border-green-500', dfs: 'border-purple-500', hybrid: 'border-orange-500' }[algo];
            return <React.Fragment key={algo}>{index > 0 && <span className={`h-3 w-px ${isLight ? 'bg-slate-300' : 'bg-gray-700'}`} />}<button type="button" aria-label={`${isFollowing ? 'Stop following' : 'Follow'} ${algo.toUpperCase()}`} aria-pressed={isFollowing} title={!isEnabled ? `${algo.toUpperCase()} is disabled in the algorithm selector` : !isVisible ? `Show ${algo.toUpperCase()} before following it` : `${isFollowing ? 'Stop following' : 'Follow'} ${algo.toUpperCase()}`} disabled={!isVisible || !isEnabled} onClick={() => setFollowAlgo(isFollowing ? null : algo)} className={`h-5 w-5 rounded-full border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${ring} ${isFollowing ? colors[algo] : `${isLight ? 'bg-white' : 'bg-gray-950'}`} ${isVisible && isEnabled ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-30'}`} /></React.Fragment>;
          })}
        </div>
      </div>

      {/* Layered Map Floor Controls */}
      {isLayeredMap && uniqueFloors.length > 1 && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 p-1.5 rounded-xl border backdrop-blur-sm z-20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.2)] ${
          isLight
            ? 'bg-white/95 border-slate-300'
            : 'bg-gray-900/90 border-gray-700 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]'
        }`}>
          {uniqueFloors.map(floor => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={`px-6 md:px-8 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                activeFloor === floor
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                  : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {floor === 'GL' ? 'GL (Ground)' : floor === 'L2' ? 'L2 (Second)' : floor === 'L3' ? 'L3 (Third)' : floor === 'L1' ? 'L1 (First)' : floor}
            </button>
          ))}
        </div>
      )}

      {/* Zoom Controls */}
      <div className="absolute bottom-3 right-1 z-20 flex w-[72px] flex-col items-stretch gap-1">
        <div className={`border rounded px-1 py-1 text-[10px] font-mono select-none text-center ${
          isLight
            ? 'bg-white/90 border-slate-300 text-slate-700 font-bold shadow-sm'
            : 'bg-gray-900/80 border-gray-700 text-gray-400'
        }`}>
          Zoom: {zoom.toFixed(1)}x
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Zoom in, centered on map"
            onClick={zoomIn}
            className={`h-8 flex-1 border rounded flex items-center justify-center cursor-pointer text-xl font-bold transition-colors ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white'
            }`}
          >+</button>
          <button
            type="button"
            aria-label="Zoom out, centered on map"
            onClick={zoomOut}
            className={`h-8 flex-1 border rounded flex items-center justify-center cursor-pointer text-xl font-bold transition-colors ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
                : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white'
            }`}
          >-</button>
        </div>
        <button 
          type="button"
          aria-label="Reset map zoom"
          onClick={resetZoom} 
          className={`w-full px-2 py-1 border rounded text-xs font-bold cursor-pointer transition-colors ${
            isLight
              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
              : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300'
          }`}
        >Reset</button>
      </div>
    </>
  );
};
