import React from 'react';
import { Network, Bot, Car, Flame, Gamepad2 } from './icons';
import { useTheme } from '../context/ThemeContext';

interface ScenarioConfig {
  id: string;
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
  const { theme } = useTheme();
  const isLight = theme === 'light';

  return (
    <div
      className={`border p-5 transition-all duration-500 relative overflow-hidden ${
        isLight ? 'bg-white shadow-md rounded-none' : 'bg-gray-900/40'
      }`}
      style={{
        borderColor: isLight ? '#cbd5e1' : config.color + '33',
        borderLeftColor: config.color,
        borderLeftWidth: '5px'
      }}
    >
      <div className="flex flex-col sm:flex-row items-start gap-6">
        
        {/* Abstract Icon Block */}
        <div 
          className={`shrink-0 p-4 border flex items-center justify-center ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-gray-950'
          }`}
          style={{ borderColor: isLight ? config.color + '60' : config.color + '40', color: config.color, filter: `drop-shadow(0 0 10px ${config.color}40)` }}
        >
          {(() => {
            const className = "w-12 h-12";
            switch (config.id) {
              case 'network': return <Network className={className} />;
              case 'robotics': return <Bot className={className} />;
              case 'traffic': return <Car className={className} />;
              case 'evacuation': return <Flame className={className} />;
              case 'gameai': return <Gamepad2 className={className} />;
              default: return <Network className={className} />;
            }
          })()}
        </div>

        <div className="flex-1 w-full">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-bold text-lg tracking-wide uppercase font-mono ${
              isLight ? 'text-slate-900 font-extrabold' : 'text-gray-100'
            }`}>
              {config.name}
            </h3>
            <span 
              className={`text-[9px] px-2 py-1 font-mono uppercase tracking-widest hidden sm:block border ${
                isLight ? 'bg-slate-100 border-slate-300 font-bold' : 'bg-gray-950'
              }`}
              style={{ color: isLight ? config.color : config.color, borderColor: isLight ? '#cbd5e1' : config.color + '40' }}
            >
              Configured
            </span>
          </div>
          
          <p className={`text-sm leading-relaxed mb-6 font-sans ${
            isLight ? 'text-slate-700 font-medium' : 'text-gray-400'
          }`}>
            {config.description}
          </p>
          
          {/* Analytical Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className={`p-3 border ${
              isLight ? 'bg-slate-50 border-slate-200 shadow-2xs' : 'bg-gray-950 border-gray-800'
            }`}>
              <span className={`block text-[9px] uppercase font-mono tracking-widest mb-1.5 ${
                isLight ? 'text-slate-600 font-bold' : 'text-gray-500'
              }`}>Source Node (Ingress)</span>
              <span className={`text-xs font-mono flex items-center gap-2 ${
                isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 ${isLight ? 'bg-emerald-600' : 'bg-emerald-400'}`}></span> {config.startLabel}
              </span>
            </div>
            
            <div className={`p-3 border ${
              isLight ? 'bg-slate-50 border-slate-200 shadow-2xs' : 'bg-gray-950 border-gray-800'
            }`}>
              <span className={`block text-[9px] uppercase font-mono tracking-widest mb-1.5 ${
                isLight ? 'text-slate-600 font-bold' : 'text-gray-500'
              }`}>Target Nodes (Multi-Exit)</span>
              <span className={`text-xs font-mono flex items-center gap-2 ${
                isLight ? 'text-blue-700 font-bold' : 'text-blue-400'
              }`}>
                <span className={`w-1.5 h-1.5 ${isLight ? 'bg-blue-600' : 'bg-blue-400'}`}></span> {config.exitLabel} <span className={isLight ? 'text-slate-500 text-[10px]' : 'text-gray-500 text-[10px]'}>({config.id === 'robotics' ? 'Dynamic Bay Count' : 'Dynamic Count'})</span>
              </span>
            </div>

            <div className={`p-3 border md:col-span-2 lg:col-span-1 ${
              isLight ? 'bg-slate-50 border-slate-200 shadow-2xs' : 'bg-gray-950 border-gray-800'
            }`}>
              <span className={`block text-[9px] uppercase font-mono tracking-widest mb-1.5 ${
                isLight ? 'text-slate-600 font-bold' : 'text-gray-500'
              }`}>Dynamic Disturbance Model</span>
              <span 
                className="text-xs font-mono flex items-center gap-2 font-bold"
                style={{ color: isLight ? config.color : config.color }}
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