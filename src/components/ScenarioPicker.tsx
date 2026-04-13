import React, { useState } from 'react';
import { ScenarioType, AlgorithmType } from '../types';
import { SCENARIOS, ALGORITHMS } from '../config/scenarios';

interface Props {
  onStart: (scenario: ScenarioType, algorithm: AlgorithmType) => void;
}

export const ScenarioPicker: React.FC<Props> = ({ onStart }) => {
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('network');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('bfs');

  const sc = SCENARIOS.find((s) => s.id === selectedScenario)!;
  const al = ALGORITHMS.find((a) => a.id === selectedAlgorithm)!;

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white flex flex-col items-center justify-center p-8">
      {/* Title */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-3 mb-4">
          <span className="text-4xl">🧠</span>
          <h1 className="text-3xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-purple-400 to-orange-400 bg-clip-text text-transparent">
            Graph Algorithm Visualizer
          </h1>
        </div>
        <p className="text-gray-400 text-sm max-w-xl mx-auto">
          Real-world graph simulations comparing BFS, DFS, and Hybrid traversal strategies
          across five industry scenarios.
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-8">
        {/* Scenario Selection */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
            1 — Choose Scenario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SCENARIOS.map((sc) => (
              <button
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedScenario === sc.id
                    ? 'border-opacity-100 bg-opacity-10'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800'
                }`}
                style={
                  selectedScenario === sc.id
                    ? {
                        borderColor: sc.color,
                        backgroundColor: sc.color + '15',
                        boxShadow: `0 0 20px ${sc.color}22`,
                      }
                    : {}
                }
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{sc.icon}</span>
                  <div>
                    <div
                      className="font-bold text-sm mb-1"
                      style={{ color: selectedScenario === sc.id ? sc.color : '#e2e8f0' }}
                    >
                      {sc.name}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">
                      {sc.description}
                    </p>
                    <div className="mt-2 text-xs text-orange-400">
                      ⚡ {sc.dynamicDescription}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm Selection */}
        <div>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
            2 — Choose Algorithm
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ALGORITHMS.map((al) => (
              <button
                key={al.id}
                onClick={() => setSelectedAlgorithm(al.id)}
                className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                  selectedAlgorithm === al.id
                    ? ''
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500 hover:bg-gray-800'
                }`}
                style={
                  selectedAlgorithm === al.id
                    ? {
                        borderColor: al.color,
                        backgroundColor: al.color + '15',
                        boxShadow: `0 0 20px ${al.color}22`,
                      }
                    : {}
                }
              >
                <div
                  className="font-black text-lg mb-1"
                  style={{ color: selectedAlgorithm === al.id ? al.color : '#e2e8f0' }}
                >
                  {al.name}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {al.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => onStart(selectedScenario, selectedAlgorithm)}
            className="px-10 py-4 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: al.color,
              color: '#000',
              boxShadow: `0 0 32px ${al.color}55`,
            }}
          >
            ▶ Start Simulation — {sc.icon} {sc.name} × {al.name}
          </button>
        </div>

        {/* Info footer */}
        <p className="text-center text-xs text-gray-600">
          Performance Evaluation of BFS, DFS, and Hybrid Algorithms in Multi-Destination Dynamic Graph Environments
        </p>
      </div>
    </div>
  );
};
