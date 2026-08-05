import React from 'react';

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
}

export const CanvasControls: React.FC<CanvasControlsProps> = ({
  zoom, setZoom, resetZoom,
  isLayeredMap, activeFloor, setActiveFloor, uniqueFloors = [],
  isShowOpen, setIsShowOpen, visibleAlgos, toggleAlgo,
  isFollowOpen, setIsFollowOpen, followAlgo, setFollowAlgo
}) => {
  return (
    <>
      {/* Show Panel (Dropdown) — TOP LEFT */}
      <div className="absolute top-3 left-3 z-20">
        <button
          onClick={() => setIsShowOpen(o => !o)}
          className="flex items-center gap-1.5 bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl px-3 py-1.5 shadow-lg cursor-pointer hover:border-gray-500 transition-colors"
        >
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold select-none">Show</span>
          {!visibleAlgos.bfs    && <span className="w-2 h-2 rounded-full bg-green-500 opacity-40" />}
          {!visibleAlgos.dfs    && <span className="w-2 h-2 rounded-full bg-purple-500 opacity-40" />}
          {!visibleAlgos.hybrid && <span className="w-2 h-2 rounded-full bg-orange-500 opacity-40" />}
          <span className="text-gray-600 text-[9px]">{isShowOpen ? '▲' : '▼'}</span>
        </button>
        {isShowOpen && (
          <div className="mt-1 flex flex-col gap-1 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl px-2 py-2 shadow-xl">
            {([
              { algo: 'bfs',    label: 'BFS',    on: 'bg-green-600  text-white border-green-500',  off: 'text-gray-500 border-gray-700' },
              { algo: 'dfs',    label: 'DFS',    on: 'bg-purple-600 text-white border-purple-500', off: 'text-gray-500 border-gray-700' },
              { algo: 'hybrid', label: 'Hybrid', on: 'bg-orange-600 text-white border-orange-500', off: 'text-gray-500 border-gray-700' },
            ] as const).map(({ algo, label, on, off }) => (
              <button
                key={algo}
                onClick={() => toggleAlgo(algo)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-2 ${
                  visibleAlgos[algo] ? on : off
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  algo === 'bfs' ? 'bg-green-400' : algo === 'dfs' ? 'bg-purple-400' : 'bg-orange-400'
                } ${visibleAlgos[algo] ? 'opacity-100' : 'opacity-30'}`} />
                {label}
                <span className="ml-auto text-[9px] opacity-60">{visibleAlgos[algo] ? 'ON' : 'OFF'}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Follow Panel (Dropdown) — TOP RIGHT */}
      <div className="absolute top-3 right-3 z-20">
        <button
          onClick={() => setIsFollowOpen(o => !o)}
          className={`flex items-center gap-1.5 backdrop-blur-sm border rounded-xl px-3 py-1.5 shadow-lg cursor-pointer transition-colors ${
            followAlgo
              ? 'bg-blue-900/60 border-blue-500/60 hover:border-blue-400'
              : 'bg-gray-900/90 border-gray-700 hover:border-gray-500'
          }`}
        >
          <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold select-none">Follow</span>
          {followAlgo && <span className="text-[9px] font-bold text-blue-300">{followAlgo.toUpperCase()}</span>}
          <span className="text-gray-600 text-[9px]">{isFollowOpen ? '▲' : '▼'}</span>
        </button>
        {isFollowOpen && (
          <div className="mt-1 flex flex-col gap-1 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl px-2 py-2 shadow-xl">
            {(['bfs', 'dfs', 'hybrid'] as const).map((algo) => {
              const colors = {
                bfs:    { active: 'bg-green-600  text-white border-green-500',  inactive: 'text-gray-400 border-gray-700 hover:border-green-700' },
                dfs:    { active: 'bg-purple-600 text-white border-purple-500', inactive: 'text-gray-400 border-gray-700 hover:border-purple-700' },
                hybrid: { active: 'bg-orange-600 text-white border-orange-500', inactive: 'text-gray-400 border-gray-700 hover:border-orange-700' },
              };
              const dotColor = { bfs: 'bg-green-400', dfs: 'bg-purple-400', hybrid: 'bg-orange-400' };
              const isActive = followAlgo === algo;
              const isVisible = visibleAlgos[algo];
              return (
                <button
                  key={algo}
                  disabled={!isVisible}
                  onClick={() => setFollowAlgo(isActive ? null : algo)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase border transition-all flex items-center gap-2 ${
                    !isVisible ? 'opacity-30 cursor-not-allowed border-gray-700 text-gray-500' :
                    isActive ? colors[algo].active + ' cursor-pointer' : colors[algo].inactive + ' cursor-pointer'
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
                className="mt-0.5 px-3 py-1 rounded-lg text-[9px] font-bold text-red-400 border border-red-900/50 hover:bg-red-900/20 transition-all cursor-pointer"
              >
                Stop Following
              </button>
            )}
          </div>
        )}
      </div>

      {/* Layered Map Floor Controls */}
      {isLayeredMap && uniqueFloors.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-gray-900/90 p-1.5 rounded-xl border border-gray-700 backdrop-blur-sm z-20 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.5)]">
          {uniqueFloors.map(floor => (
            <button
              key={floor}
              onClick={() => setActiveFloor(floor)}
              className={`px-6 md:px-8 py-2 rounded-lg font-bold text-xs md:text-sm transition-all cursor-pointer ${
                activeFloor === floor
                  ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)]'
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
        <div className="bg-gray-900/80 border border-gray-700 rounded px-2 py-1 text-[10px] font-mono text-gray-400 select-none text-center">
          Zoom: {zoom.toFixed(1)}x
        </div>
        <button onClick={() => setZoom(z => Math.min(z * 1.5, 30))} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-xl font-bold transition-colors">+</button>
        <button onClick={() => setZoom(z => Math.max(z / 1.5, 0.2))} className="w-8 h-8 bg-gray-800 border border-gray-600 rounded text-white flex items-center justify-center hover:bg-gray-700 cursor-pointer text-xl font-bold transition-colors">-</button>
        <button onClick={resetZoom} className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs font-bold text-gray-300 hover:bg-gray-700 cursor-pointer transition-colors">Reset</button>
      </div>
    </>
  );
};
