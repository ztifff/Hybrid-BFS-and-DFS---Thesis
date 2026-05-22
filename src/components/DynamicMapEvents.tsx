import React, { useMemo } from 'react';
import { DynamicEvent } from '../types';

interface Props {
  dynamicEvents: DynamicEvent[];
  stepIndex: number;
}

export const DynamicMapEvents: React.FC<Props> = ({ dynamicEvents, stepIndex }) => {
  const activeEvents = useMemo(
    () => dynamicEvents.filter((event) => event.stepIndex <= stepIndex).reverse(),
    [dynamicEvents, stepIndex]
  );

  return (
    <div className="bg-[#0d1224] border border-gray-700 rounded-xl p-3 flex flex-col shadow-inner shrink-0 h-[220px]">
      <div className="flex items-center mb-2 shrink-0 border-b border-gray-800 pb-2">
        <h3 className="text-xs text-gray-400 font-bold uppercase tracking-wider flex items-center gap-2">
          📅 Dynamic Map Events
        </h3>
      </div>

      <div
        className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#4b5563 transparent' }}
      >
        {activeEvents.length > 0 ? (
          activeEvents.map((event, index) => (
            <div
              key={`${event.stepIndex}-${index}`}
              className={`text-[11px] p-2 rounded border transition-all ${
                event.blocked
                  ? 'border-orange-500/50 bg-orange-900/20 text-orange-300'
                  : 'border-green-500/50 bg-green-900/20 text-green-300'
              }`}
            >
              <span className="font-mono opacity-60 mr-1">[{event.stepIndex}]</span>
              {event.blocked ? '⚡' : '✅'} {event.label}
            </div>
          ))
        ) : (
          <div className="text-xs text-gray-500 text-center mt-6 italic">
            No map events triggered yet...
          </div>
        )}
      </div>
    </div>
  );
};
