import React from 'react';
import { useTheme } from '../../context/ThemeContext';

interface CanvasControlsProps {
  // Zoom
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  resetZoom: () => void;
  // Floors
  isLayeredMap: boolean;
  activeFloor: string;
  setActiveFloor: (floor: string) => void;
  uniqueFloors?: string[];
  // Show Panel
  isShowOpen: boolean;
  setIsShowOpen: React.Dispatch<React.SetStateAction<boolean>>;
  visibleAlgos: { bfs: boolean; dfs: boolean; hybrid: boolean };
  toggleAlgo: (algo: 'bfs' | 'dfs' | 'hybrid') => void;
  // Follow Panel
  isFollowOpen: boolean;
  setIsFollowOpen: React.Dispatch<React.SetStateAction<boolean>>;
  followAlgo: 'bfs' | 'dfs' | 'hybrid' | null;
  setFollowAlgo: (algo: 'bfs' | 'dfs' | 'hybrid' | null) => void;
  // External algorithm active state (from header pills)
  activeAlgorithms?: { bfs: boolean; dfs: boolean; hybrid: boolean };
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom, setZoom, resetZoom,
  isLayeredMap, activeFloor, setActiveFloor, uniqueFloors = [],
  isShowOpen, setIsShowOpen, visibleAlgos, toggleAlgo,
  isFollowOpen, setIsFollowOpen, followAlgo, setFollowAlgo,
  activeAlgorithms,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <>
      {/* Show Panel (Dropdown) — TOP LEFT */}
      <div className="absolute top-3 left-3 z-20">
        <button
          onClick={() => setIsShowOpen(o => !o)}
          className={`flex items-center gap-1.5 backdrop-blur-sm border rounded-xl px-3 py-1.5 shadow-lg cursor-pointer transition-colors ${
            isLight
              ? 'bg-white/95 border-slate-300 hover:border-slate-400 text-slate-800'
              : 'bg-gray-900/90 border-gray-700 hover:border-gray-500 text-gray-300'
          }`}
        >
          <span className={`text-[9px] uppercase tracking-widest font-bold select-none ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>Show</span>
          {!visibleAlgos.bfs    && <span className="w-2 h-2 rounded-full bg-green-500 opacity-40" />}
          {!visibleAlgos.dfs    && <span className="w-2 h-2 rounded-full bg-purple-500 opacity-40" />}
          {!visibleAlgos.hybrid && <span className="w-2 h-2 rounded-full bg-orange-500 opacity-40" />}
          <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-gray-600'}`}>{isShowOpen ? '▲' : '▼'}</span>
        </button>
        {isShowOpen && (
          <div className={`mt-1 flex flex-col gap-1 backdrop-blur-sm border rounded-xl px-2 py-2 shadow-xl ${
            isLight
              ? 'bg-white/98 border-slate-300 text-slate-900 shadow-slate-300/40'
              : 'bg-gray-900/95 border-gray-700 shadow-black/50'
          }`}>
            {([
              { 
                algo: 'bfs',    
                label: 'BFS',    
                on: isLight ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-green-600 text-white border-green-500',  
                off: isLight ? 'text-slate-600 border-slate-200 bg-slate-50 hover:bg-slate-100' : 'text-gray-500 border-gray-700' 
              },
              { 
                algo: 'dfs',    
                label: 'DFS',    
                on: isLight ? 'bg-purple-600 text-white border-purple-500' : 'bg-purple-600 text-white border-purple-500', 
                off: isLight ? 'text-slate-600 border-slate-200 bg-slate-50 hover:bg-slate-100' : 'text-gray-500 border-gray-700' 
              },
              { 
                algo: 'hybrid', 
                label: 'Hybrid', 
                on: isLight ? 'bg-amber-600 text-white border-amber-500' : 'bg-orange-600 text-white border-orange-500', 
                off: isLight ? 'text-slate-600 border-slate-200 bg-slate-50 hover:bg-slate-100' : 'text-gray-500 border-gray-700' 
              },
            ] as const).map(({ algo, label, on, off }) => {
              const isGloballyDisabled = activeAlgorithms ? !activeAlgorithms[algo] : false;
              return (
                <button
                  key={algo}
                  onClick={() => !isGloballyDisabled && toggleAlgo(algo)}
                  disabled={isGloballyDisabled}
                  title={isGloballyDisabled ? `${label} is hidden from the header — click the pill to re-enable` : undefined}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-2 ${
                    isGloballyDisabled
                      ? isLight ? 'opacity-40 cursor-not-allowed border-slate-200 text-slate-400 bg-slate-100' : 'opacity-40 cursor-not-allowed border-gray-700 text-gray-500 bg-gray-800/30'
                      : `cursor-pointer ${visibleAlgos[algo] ? on : off}`
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    algo === 'bfs' ? 'bg-green-500' : algo === 'dfs' ? 'bg-purple-500' : 'bg-orange-500'
                  } ${(isGloballyDisabled || !visibleAlgos[algo]) ? 'opacity-30' : 'opacity-100'}`} />
                  {isGloballyDisabled ? '⊘ ' : ''}{label}
                  <span className="ml-auto text-[9px] opacity-75">
                    {isGloballyDisabled ? 'LOCKED' : visibleAlgos[algo] ? 'ON' : 'OFF'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Follow Panel (Dropdown) — TOP RIGHT */}
      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={() => setIsFollowOpen(o => !o)}
          className={`flex items-center gap-1.5 backdrop-blur-sm border rounded-xl px-3 py-1.5 shadow-lg cursor-pointer transition-colors ${
            followAlgo
              ? isLight
                ? 'bg-blue-50 border-blue-400 text-blue-700 hover:border-blue-500'
                : 'bg-blue-900/60 border-blue-500/60 hover:border-blue-400 text-blue-200'
              : isLight
                ? 'bg-white/95 border-slate-300 hover:border-slate-400 text-slate-800'
                : 'bg-gray-900/90 border-gray-700 hover:border-gray-500 text-gray-300'
          }`}
        >
          <span className={`text-[9px] uppercase tracking-widest font-bold select-none ${isLight ? 'text-slate-700' : 'text-gray-400'}`}>Follow</span>
          {followAlgo && <span className={`text-[9px] font-bold ${isLight ? 'text-blue-700' : 'text-blue-300'}`}>{followAlgo.toUpperCase()}</span>}
          <span className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-gray-600'}`}>{isFollowOpen ? '▲' : '▼'}</span>
        </button>
        {isFollowOpen && (
          <div className={`mt-1 flex flex-col gap-1 backdrop-blur-sm border rounded-xl px-2 py-2 shadow-xl ${
            isLight
              ? 'bg-white/98 border-slate-300 text-slate-900 shadow-slate-300/40'
              : 'bg-gray-900/95 border-gray-700 shadow-black/50'
          }`}>
            {(['bfs', 'dfs', 'hybrid'] as const).map((algo) => {
              const colors = {
                bfs:    { 
                  active: isLight ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-green-600 text-white border-green-500',  
                  inactive: isLight ? 'text-slate-700 border-slate-200 hover:border-emerald-600 hover:bg-slate-50' : 'text-gray-400 border-gray-700 hover:border-green-700' 
                },
                dfs:    { 
                  active: isLight ? 'bg-purple-600 text-white border-purple-500' : 'bg-purple-600 text-white border-purple-500', 
                  inactive: isLight ? 'text-slate-700 border-slate-200 hover:border-purple-600 hover:bg-slate-50' : 'text-gray-400 border-gray-700 hover:border-purple-700' 
                },
                hybrid: { 
                  active: isLight ? 'bg-amber-600 text-white border-amber-500' : 'bg-orange-600 text-white border-orange-500', 
                  inactive: isLight ? 'text-slate-700 border-slate-200 hover:border-amber-600 hover:bg-slate-50' : 'text-gray-400 border-gray-700 hover:border-orange-700' 
                },
              };
              const dotColor = { bfs: 'bg-green-500', dfs: 'bg-purple-500', hybrid: 'bg-orange-500' };
              const isActive = followAlgo === algo;
              const isVisible = visibleAlgos[algo];
              return (
                <button
                  key={algo}
                  disabled={!isVisible}
                  onClick={() => setFollowAlgo(isActive ? null : algo)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center gap-2 ${
                    !isVisible ? isLight ? 'opacity-30 cursor-not-allowed border-slate-200 text-slate-400' : 'opacity-30 cursor-not-allowed border-gray-700 text-gray-500' :
                    isActive ? colors[algo].active + ' cursor-pointer shadow-sm' : colors[algo].inactive + ' cursor-pointer'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor[algo]} ${isActive ? 'opacity-100' : 'opacity-30'}`} />
                  {isActive ? '📡 ' : ''}{algo}
                </button>
              );
            })}
            {followAlgo && (
              <button
                onClick={() => setFollowAlgo(null)}
                className={`mt-0.5 px-3 py-1 rounded-lg text-[9px] font-bold border transition-all cursor-pointer ${
                  isLight
                    ? 'text-red-700 border-red-300 hover:bg-red-50'
                    : 'text-red-400 border-red-900/50 hover:bg-red-900/20'
                }`}
              >
                Stop Following
              </button>
            )}
          </div>
        )}
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
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-20">
        <div className={`border rounded px-2 py-1 text-[10px] font-mono select-none text-center ${
          isLight
            ? 'bg-white/90 border-slate-300 text-slate-700 font-bold shadow-sm'
            : 'bg-gray-900/80 border-gray-700 text-gray-400'
        }`}>
          Zoom: {zoom.toFixed(1)}x
        </div>
        <button 
          onClick={() => setZoom(z => Math.min(z * 1.5, 30))} 
          className={`w-8 h-8 border rounded flex items-center justify-center cursor-pointer text-xl font-bold transition-colors ${
            isLight
              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
              : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white'
          }`}
        >+</button>
        <button 
          onClick={() => setZoom(z => Math.max(z / 1.5, 0.1))} 
          className={`w-8 h-8 border rounded flex items-center justify-center cursor-pointer text-xl font-bold transition-colors ${
            isLight
              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
              : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-white'
          }`}
        >-</button>
        <button 
          onClick={resetZoom} 
          className={`px-2 py-1 border rounded text-xs font-bold cursor-pointer transition-colors ${
            isLight
              ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
              : 'bg-gray-800 hover:bg-gray-700 border-gray-600 text-gray-300'
          }`}
        >Reset</button>
      </div>
    </>
  );
};
