import React from 'react';

interface ScenarioConfig {
  name: string;
  description: string;
  icon: string;
  color: string;
  dynamicDescription: string;
  startLabel: string;
  exitLabel: string;
}

interface Props {
  config: ScenarioConfig;
}

export const ScenarioInfo: React.FC<Props> = ({ config }) => {
  return (
    <div
      className="border p-5 transition-all duration-500 relative overflow-hidden bg-gray-900/40"
      style={{
        borderColor: config.color + '33',
        borderLeftColor: config.color,
        borderLeftWidth: '4px'
      }}
    >
      <div className="flex flex-col sm:flex-row items-start gap-6">
        
        {/* Abstract Icon Block */}
        <div 
          className="text-5xl shrink-0 p-4 border bg-gray-950 grayscale opacity-80"
          style={{ borderColor: config.color + '22' }}
        >
          {config.icon}
        </div>

        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-100 text-lg tracking-wide uppercase font-mono">
              {config.name}
            </h3>
            <span 
              className="text-[9px] px-2 py-1 font-mono uppercase tracking-widest hidden sm:block border bg-gray-950"
              style={{ color: config.color, borderColor: config.color + '40' }}
            >
              Configured
            </span>
          </div>
          
          <p className="text-sm text-gray-400 leading-relaxed mb-6 font-sans">
            {config.description}
          </p>
          
          {/* Analytical Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-gray-950 p-3 border border-gray-800">
              <span className="block text-[9px] text-gray-500 uppercase font-mono tracking-widest mb-1.5">Source Node (Ingress)</span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-emerald-400"></span> {config.startLabel}
              </span>
            </div>
            
            <div className="bg-gray-950 p-3 border border-gray-800">
              {/* 🧠 FIX: Updated the Exit Nodes block to accurately reflect >3 targets */}
              <span className="block text-[9px] text-gray-500 uppercase font-mono tracking-widest mb-1.5">Target Nodes (Multi-Exit)</span>
              <span className="text-xs font-mono text-blue-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400"></span> {config.exitLabel} <span className="text-gray-500 text-[10px]">(Dynamic Count)</span>
              </span>
            </div>

            <div className="bg-gray-950 p-3 border border-gray-800 md:col-span-2 lg:col-span-1">
              <span className="block text-[9px] text-gray-500 uppercase font-mono tracking-widest mb-1.5">Dynamic Disturbance Model</span>
              <span 
                className="text-xs font-mono flex items-center gap-2"
                style={{ color: config.color }}
              >
                <span className="w-1.5 h-1.5 animate-pulse" style={{ backgroundColor: config.color }}></span> 
                {config.dynamicDescription}
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};