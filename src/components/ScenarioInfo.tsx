import React from 'react';

// Define the shape of the data we expect from the backend
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
      className="rounded-xl border p-5 mt-2 mb-4 max-w-4xl mx-auto shadow-lg backdrop-blur-sm"
      style={{
        borderColor: config.color + '66',
        backgroundColor: config.color + '11',
      }}
    >
      <div className="flex flex-col sm:flex-row items-start gap-5">
        <div className="text-5xl drop-shadow-md shrink-0">{config.icon}</div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg mb-2 flex items-center gap-2">
            {config.name}
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-300 font-mono border border-blue-500/30 uppercase tracking-wider">
              Selected
            </span>
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            {config.description}
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-gray-700/50 pt-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Starting Point</span>
              <span className="text-xs text-green-400 font-medium">● {config.startLabel}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Multiple Exits</span>
              <span className="text-xs text-blue-400 font-medium">● {config.exitLabel} (×3)</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Dynamic Hazard</span>
              <span className="text-xs text-orange-400 font-medium">⚠️ {config.dynamicDescription}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};