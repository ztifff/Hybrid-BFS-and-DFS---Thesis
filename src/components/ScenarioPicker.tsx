import React, { useState, useEffect } from 'react';
import { Network, Bot, Car, Flame, Gamepad2 } from './icons';
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

const makeHexWithAlpha = (color: string, alpha: number) => {
  if (!color.startsWith('#')) return color;
  const hex = color.slice(1);
  const normalized = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (normalized.length !== 6) return color;
  const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `#${normalized}${alphaHex}`;
};

export const ScenarioPicker: React.FC<Props> = ({
  selectedScenario,
  onSelectScenario,
  onStart,
}) => {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

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
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleExecute = () => {
    if (!canStart || isExecuting) return;
    setIsExecuting(true);
    setTimeout(() => {
      onStart();
      setIsExecuting(false);
    }, 600);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTermsOpen || isPrivacyOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        const currentIndex = scenarios.findIndex(s => s.id === selectedScenario);
        if (currentIndex === -1) return;
        let nextIndex = e.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= scenarios.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = scenarios.length - 1;
        onSelectScenario(scenarios[nextIndex].id);
      }
      if (e.key === 'Enter') {
        if (canStart && !isExecuting) handleExecute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scenarios, selectedScenario, canStart, isTermsOpen, isPrivacyOpen, isExecuting, onSelectScenario]);

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
                      ? 'shadow-[0_0_15px_rgba(0,0,0,0.5)] transform -translate-y-1'
                      : 'bg-gray-950 border-white/10 hover:border-white/30 hover:bg-gray-900 opacity-60 hover:opacity-100'}
                  `}
                  style={{
                    // 🧠 FIX: Apply a highly transparent background (1A = ~10% opacity) and a glowing border based on the scenario's unique color!
                    backgroundColor: isActive ? scenario.color + '1A' : undefined,
                    borderColor: isActive ? scenario.color + '66' : undefined,
                    borderTopColor: isActive ? scenario.color : undefined,
                    borderTopWidth: isActive ? '3px' : '1px'
                  }}
                >
                  <span
                    className={`mb-3 transition-transform duration-300 flex items-center justify-center ${isActive ? 'scale-110' : 'opacity-90 group-hover:scale-110 grayscale'}`}
                    style={{ color: isActive ? scenario.color : '#9ca3af', filter: isActive ? `drop-shadow(0 0 10px ${scenario.color}80)` : 'none' }}
                  >
                    {(() => {
                      const className = "w-8 h-8";
                      switch (scenario.id) {
                        case 'network': return <Network className={className} />;
                        case 'robotics': return <Bot className={className} />;
                        case 'traffic': return <Car className={className} />;
                        case 'evacuation': return <Flame className={className} />;
                        case 'gameai': return <Gamepad2 className={className} />;
                        default: return <Network className={className} />;
                      }
                    })()}
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
          onClick={handleExecute}
          disabled={!canStart || isExecuting}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          className="group relative overflow-hidden w-full py-4 font-mono font-bold text-sm tracking-widest uppercase transition-all duration-300 border"
          style={(() => {
            const activeColor = activeScenarioConfig?.color || '#2563eb';
            const activeBg = makeHexWithAlpha(activeColor, canStart && !isExecuting ? (isButtonHovered ? 0.2 : 0.1) : 0.05);
            const borderColor = canStart && !isExecuting ? makeHexWithAlpha(activeColor, isButtonHovered ? 0.7 : 0.4) : '#374151';
            const textColor = canStart && !isExecuting ? activeColor : '#9ca3af';
            const boxShadow = (canStart && !isExecuting && isButtonHovered) ? `0 0 15px ${makeHexWithAlpha(activeColor, 0.4)}` : undefined;
            return {
              backgroundColor: activeBg,
              borderColor,
              color: textColor,
              boxShadow,
            };
          })()}
        >
          {isExecuting ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${activeScenarioConfig?.color}40`, borderTopColor: activeScenarioConfig?.color }} />
              Initializing Simulation...
            </span>
          ) : canStart ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Execute Comparative Analysis (BFS vs DFS vs Hybrid)
            </span>
          ) : (
            'Awaiting Topology Data...'
          )}
        </button>
      </div>

      {/* FOOTER */}
      <footer className="mt-8 pt-4 border-t border-gray-800 shrink-0 relative z-10 flex flex-col sm:flex-row items-center justify-between text-[10px] text-gray-500 font-mono w-full">
        <div className="flex gap-4">
          <button onClick={() => setIsTermsOpen(true)} className="hover:text-blue-400 transition-colors uppercase tracking-widest">Terms of Use</button>
          <button onClick={() => setIsPrivacyOpen(true)} className="hover:text-blue-400 transition-colors uppercase tracking-widest">Privacy Policy</button>
        </div>
        <div className="mt-2 sm:mt-0 text-gray-600 tracking-widest">
          ACADEMIC THESIS SYSTEM © {new Date().getFullYear()}
        </div>
      </footer>

      {/* TERMS OF USE MODAL */}
      {isTermsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsTermsOpen(false)}>
          <div className="bg-[#0d1224] text-gray-300 border border-gray-700 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#0a0f1e] text-white border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-widest uppercase text-blue-400" style={{ fontFamily: 'monospace' }}>TERMS OF USE</h2>
              <button onClick={() => setIsTermsOpen(false)} className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
              <p>This Algorithm Benchmarking Tool is generously offered at no cost to the global Computer Science community. If you appreciate this tool, we kindly request that you <strong className="text-gray-100">spread the word about its existence to fellow Computer Science students and instructors.</strong> You can share this tool through social media platforms, course webpages, blog reviews, emails, and more.</p>
              <p>Data Structures and Algorithms (DSA) students and instructors are welcome to use this website directly for their classes. If you capture screenshots or videos from this site, feel free to use them elsewhere, provided that you cite the URL of this website or the list of publications below as references. However, please refrain from downloading the client-side files and hosting them on your website, as this constitutes plagiarism.</p>
              <p>Please note that this evaluation tool has a substantial simulation engine, and it is not easy to save server-side scripts and databases locally. Currently, the general public can access the core pathfinding system only through the interactive mode.</p>
              <h3 className="font-bold text-base mt-6 text-gray-100">List of Publications</h3>
              <p>This work is presented as an Academic Thesis for the evaluation of hybrid pathfinding algorithms. You can refer to our upcoming paper about this system for a detailed breakdown of the BFS, DFS, and Hybrid metrics.</p>
              <h3 className="font-bold text-base mt-6 text-gray-100">Bug Reports or Request for New Features</h3>
              <p>This benchmarking tool is not a finished product. The developers are still actively improving the visualizations and analytics. If you are using this tool and spot a bug in any of our visualization pages or if you want to request for new features, please contact the authors.</p>
            </div>
          </div>
        </div>
      )}

      {/* PRIVACY POLICY MODAL */}
      {isPrivacyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setIsPrivacyOpen(false)}>
          <div className="bg-[#0d1224] text-gray-300 border border-gray-700 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)] w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="bg-[#0a0f1e] text-white border-b border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold tracking-widest uppercase text-blue-400" style={{ fontFamily: 'monospace' }}>PRIVACY POLICY</h2>
              <button onClick={() => setIsPrivacyOpen(false)} className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer">
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto text-sm space-y-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}>
              <p className="font-bold text-gray-100 border-b border-gray-800 pb-2">Version 1.0 (Updated {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })})</p>
              <p>Since the initial deployment, we do not use Google Analytics or invasive tracking scripts. Thus, all cookies that we use now are solely for the operations of this website. The annoying cookie-consent popup is now turned off even for first-time visitors.</p>
              <p>Since this is an Academic Thesis project, anyone in the world can self-create a local benchmarking session to test algorithms on various topologies (e.g., Datacenters, Robotics, ISP Networks, Traffic, Game AI).</p>
              <p>Additionally, for students and researchers, by using the export features, you are taking a localized copy of your data. We do not store any personal data on our server side. Your simulation logs and performance evaluations are kept on your local machine.</p>
              <p>For other CS researchers worldwide who evaluate pathfinding systems, your session state is maintained securely. You can freely use the material to enhance your data structures and algorithm classes. Note that there can be other specific features in the future.</p>
              <p>For anyone evaluating this tool, you can simply close the browser tab to clear your local session data should you wish to no longer be associated with the tool.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};