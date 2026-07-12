import React, { useState, useEffect } from 'react';
import { ScenarioType } from '../types';
import { ScenarioInfo } from './ScenarioInfo';

interface ScenarioConfig {
  id: ScenarioType;
  name: string;
  description: string;
  icon: string;
  color: string;
  dynamicDescription: string;
  startLabel: string;
  exitLabel: string;
}

interface Props {
  selectedScenario: ScenarioType | null;
  onSelectScenario: (s: ScenarioType) => void;
  onStart: () => void;
}

export const ScenarioPicker: React.FC<Props> = ({
  selectedScenario,
  onSelectScenario,
  onStart,
}) => {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const response = await fetch('https://backend-1e4y.onrender.com/api/scenarios');
        if (!response.ok) return;
        const json = await response.json();
        if (json.success && Array.isArray(json.data)) {
          setScenarios(json.data);
          if (!selectedScenario && json.data.length > 0) {
            onSelectScenario(json.data[0].id);
          }
        }
      } catch (error) {
        console.error("Failed to load scenarios", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchScenarios();
  }, []);

  const activeScenarioConfig = scenarios.find((s) => s.id === selectedScenario);
  const canStart = selectedScenario !== null && !isLoading;

  return (
    <div className="flex flex-col h-full bg-gray-950 p-6 rounded-none border border-gray-800 shadow-2xl relative overflow-hidden">
      
      <style>
        {`
          @keyframes drift {
            0%   { transform: translate(0px, 0px) scale(1); }
            25%  { transform: translate(-30vw, 20vh) scale(1.2); }
            50%  { transform: translate(-60vw, -10vh) scale(0.9); }
            75%  { transform: translate(-20vw, 40vh) scale(1.1); }
            100% { transform: translate(0px, 0px) scale(1); }
          }
        `}
      </style>

      {/* Subtle Analytical Grid Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}
      />
      
      {/* The Drifting Background Glow */}
      <div 
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[120px] opacity-15 pointer-events-none"
        style={{ 
          backgroundColor: activeScenarioConfig?.color || '#3b82f6',
          animation: 'drift 35s ease-in-out infinite', 
          transition: 'background-color 1s ease' 
        }}
      />

      <div className="mb-6 relative z-10 flex justify-between items-end">
        <div>
          <h2 className="text-xl font-bold text-gray-200 tracking-tight flex items-center gap-3 font-mono uppercase">
            <span className="text-blue-500 animate-pulse">_</span> Evaluation Topology
            {isLoading && (
               <span className="flex h-2 w-2 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
               </span>
            )}
          </h2>
          <p className="text-gray-500 text-xs mt-1 font-mono uppercase tracking-wider">Select Graph Environment for Algorithm Benchmarking</p>
        </div>
        
        {/* Animated System Status Readout */}
        <div className="hidden sm:flex flex-col items-end">
           <span className="text-[10px] text-gray-600 font-mono uppercase tracking-widest flex items-center gap-1.5">
             System Status
             <span className={`w-1.5 h-1.5 rounded-full ${canStart ? 'bg-emerald-500/50' : 'bg-amber-500/50'} animate-pulse`}></span>
           </span>
           <span className={`text-xs font-mono font-bold tracking-wide flex items-center gap-2 ${canStart ? 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'text-amber-500'}`}>
             {canStart ? 'READY FOR EVALUATION' : 'INITIALIZING...'}
             <span className="w-1.5 h-3 bg-emerald-400/80 animate-[ping_1s_steps(2,start)_infinite]"></span>
           </span>
           {canStart && (
             <div className="w-full h-0.5 bg-gray-800 mt-1.5 overflow-hidden rounded-full relative">
               <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-emerald-500/50 rounded-full" 
                    style={{ animation: 'translateX 2s linear infinite' }}>
                    <style>
                      {`
                        @keyframes translateX {
                          0% { transform: translateX(-100%); opacity: 0; }
                          50% { opacity: 1; }
                          100% { transform: translateX(300%); opacity: 0; }
                        }
                      `}
                    </style>
               </div>
             </div>
           )}
        </div>
      </div>

      {/* HORIZONTAL MODULE CAROUSEL */}
      <section className="mb-6 relative z-10">
        {!isLoading && scenarios.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory" style={{ scrollbarWidth: 'thin', scrollbarColor: '#374151 transparent' }}>
            {scenarios.map((scenario) => {
              const isActive = selectedScenario === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario.id)}
                  className={`
                    group relative flex flex-col items-center justify-center min-w-[150px] p-4 border transition-all duration-300 snap-center
                    ${isActive 
                        ? 'shadow-[0_0_15px_rgba(0,0,0,0.5)] transform -translate-y-1' // 🧠 FIX: Removed the hardcoded bg-gray-900 so the inline style can take over
                        : 'bg-gray-950 border-gray-800 hover:border-gray-700 hover:bg-gray-900 opacity-60 hover:opacity-100'}
                  `}
                  style={{
                    // 🧠 FIX: Apply a highly transparent background (1A = ~10% opacity) and a glowing border based on the scenario's unique color!
                    backgroundColor: isActive ? scenario.color + '1A' : undefined,
                    borderColor: isActive ? scenario.color + '66' : undefined,
                    borderTopColor: isActive ? scenario.color : undefined,
                    borderTopWidth: isActive ? '3px' : '1px'
                  }}
                >
                  <span className={`text-3xl mb-3 transition-transform ${isActive ? 'scale-110 drop-shadow-md' : 'opacity-90 group-hover:scale-110 grayscale'}`}>
                    {scenario.icon}
                  </span>
                  <span className={`text-xs font-mono tracking-widest uppercase ${isActive ? 'text-gray-100 font-bold' : 'text-gray-500'}`}>
                    {scenario.name.replace(' Network', '').replace(' Simulation', '')}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* DYNAMIC SCENARIO BRIEFING */}
      <div className="flex-1 min-h-0 overflow-y-auto relative z-10" style={{ scrollbarWidth: 'none' }}>
        {activeScenarioConfig && (
          <div className="animate-fade-in-up">
             <ScenarioInfo config={activeScenarioConfig} />
          </div>
        )}
      </div>

      {/* START BUTTON */}
      <div className="mt-4 pt-4 shrink-0 relative z-10 flex justify-center">
        <button
          onClick={onStart}
          disabled={!canStart}
          className={`
            relative overflow-hidden w-full py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all duration-300 border
            ${canStart
                ? 'bg-blue-900/20 text-blue-400 border-blue-500/50 hover:bg-blue-900/40 hover:text-blue-300 hover:border-blue-400 hover:-translate-y-0.5 shadow-[0_0_15px_rgba(37,99,235,0.15)]'
                : 'bg-gray-900 text-gray-600 cursor-not-allowed border-gray-800'
            }
          `}
        >
          {canStart ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Execute Comparative Analysis (BFS vs DFS vs Hybrid)
            </span>
          ) : (
            'Awaiting Topology Data...'
          )}
        </button>
      </div>
    </div>
  );
};