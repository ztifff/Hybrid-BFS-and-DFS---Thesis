import React from 'react';
import { ScenarioType, AlgorithmType } from '../types';
import { getScenario, getAlgorithm, ALGORITHMS } from '../config/scenarios';

interface Props {
  scenario: ScenarioType;
  algorithm: AlgorithmType;
}

export const ScenarioInfo: React.FC<Props> = ({ scenario, algorithm }) => {
  const sc = getScenario(scenario);
  const al = getAlgorithm(algorithm);

  return (
    <div
      className="rounded-xl border p-4 mt-4"
      style={{
        borderColor: sc.color + '44',
        backgroundColor: sc.color + '0a',
      }}
    >
      <div className="flex items-start gap-4">
        <div className="text-4xl">{sc.icon}</div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-sm mb-1">{sc.name}</h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-2">
            {sc.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: al.color + '22', color: al.color }}
            >
              {al.name}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/40 text-orange-300">
              ⚡ Dynamic
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-300">
              🚪 Multi-Exit
            </span>
          </div>
        </div>
      </div>

      {/* Algorithm comparison hint */}
      <div className="mt-4 border-t border-gray-700 pt-3">
        <p className="text-xs text-gray-500 mb-2">
          Try all algorithms on this scenario to compare:
        </p>
        <div className="flex gap-2">
          {ALGORITHMS.map((a) => (
            <div
              key={a.id}
              className="text-xs px-2 py-1 rounded border"
              style={{
                borderColor: a.color + '55',
                color: a.id === algorithm ? a.color : '#6b7280',
                backgroundColor: a.id === algorithm ? a.color + '22' : 'transparent',
              }}
            >
              {a.id === algorithm ? '▶ ' : ''}{a.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
