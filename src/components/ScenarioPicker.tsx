import React from 'react';
import { SCENARIOS, ALGORITHMS } from '../config/scenarios';
import { ScenarioType, AlgorithmType } from '../types';
import { ScenarioInfo } from './ScenarioInfo';

interface Props {
  selectedScenario: ScenarioType | null;
  selectedAlgorithm: AlgorithmType | null;
  onSelectScenario: (s: ScenarioType) => void;
  onSelectAlgorithm: (a: AlgorithmType) => void;
  onStart: () => void;
}

export const ScenarioPicker: React.FC<Props> = ({
  selectedScenario,
  selectedAlgorithm,
  onSelectScenario,
  onSelectAlgorithm,
  onStart,
}) => {
  const canStart = selectedScenario !== null && selectedAlgorithm !== null;

  return (
    <div className="min-h-screen bg-[#0f1117] text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl">⚙️</div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">
              Performance Evaluation of BFS and DFS Algorithms
            </h1>
            <p className="text-xs text-gray-400">
              in Multi-Exit Dynamic Environments
            </p>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            Standard BFS
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            Standard DFS
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500" />
            Hybrid BFS-DFS
          </div>
          <div className="text-gray-600">|</div>
          <div className="text-gray-500">5 Real-World Scenarios</div>
        </div>
      </header>

      <main className="flex-1 px-8 py-8 max-w-7xl mx-auto w-full">
        {/* Study intro */}
        <div className="mb-8 p-5 rounded-xl border border-blue-900/50 bg-blue-950/20">
          <div className="flex items-start gap-4">
            <div className="text-3xl">🔬</div>
            <div>
              <h2 className="font-bold text-blue-300 mb-1 text-sm">
                About This Study
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed max-w-4xl">
                This simulation evaluates the performance of <span className="text-green-400 font-semibold">Standard BFS</span>,{' '}
                <span className="text-purple-400 font-semibold">Standard DFS</span>, and a proposed{' '}
                <span className="text-orange-400 font-semibold">Hybrid BFS-DFS</span> algorithm across
                five real-world dynamic environments. Each scenario features <span className="text-yellow-400">multiple exit points</span> and{' '}
                <span className="text-orange-400">dynamic obstacles</span> that change during traversal,
                simulating real-world complexity. Metrics include nodes explored, execution time, path length, and memory usage.
              </p>
            </div>
          </div>
        </div>

        {/* Step 1 - Scenario */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              1
            </div>
            <h2 className="text-xl font-semibold text-white">
              Select Real-World Scenario
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {SCENARIOS.map((scenario) => {
              const isSelected = selectedScenario === scenario.id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => onSelectScenario(scenario.id)}
                  className={`
                    relative p-4 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer
                    hover:scale-[1.02] hover:shadow-lg
                    ${
                      isSelected
                        ? 'border-opacity-100 bg-opacity-10 shadow-lg'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                    }
                  `}
                  style={
                    isSelected
                      ? {
                          borderColor: scenario.color,
                          backgroundColor: scenario.color + '18',
                          boxShadow: `0 0 20px ${scenario.color}33`,
                        }
                      : {}
                  }
                >
                  {isSelected && (
                    <div
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                      style={{ backgroundColor: scenario.color }}
                    >
                      ✓
                    </div>
                  )}
                  <div className="text-3xl mb-3">{scenario.icon}</div>
                  <h3
                    className="font-bold text-sm mb-2"
                    style={{ color: isSelected ? scenario.color : '#e2e8f0' }}
                  >
                    {scenario.name}
                  </h3>
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    {scenario.description}
                  </p>
                  <div
                    className="text-xs px-2 py-1 rounded-full inline-block"
                    style={{
                      backgroundColor: scenario.color + '22',
                      color: scenario.color,
                    }}
                  >
                    ⚡ {scenario.dynamicDescription}
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-1">
                    <div className="text-xs text-gray-500">
                      <span className="text-green-400">●</span>{' '}
                      {scenario.startLabel}
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-red-400">●</span>{' '}
                      {scenario.exitLabel} (×3)
                    </div>
                    <div className="text-xs text-gray-500">
                      <span className="text-orange-400">●</span>{' '}
                      {scenario.obstacleLabel}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Step 2 - Algorithm */}
        <section className="mb-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
              2
            </div>
            <h2 className="text-xl font-semibold text-white">
              Select Search Algorithm
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ALGORITHMS.map((algo) => {
              const isSelected = selectedAlgorithm === algo.id;
              return (
                <button
                  key={algo.id}
                  onClick={() => onSelectAlgorithm(algo.id)}
                  className={`
                    relative p-5 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer
                    hover:scale-[1.01] hover:shadow-lg
                    ${
                      isSelected
                        ? 'bg-opacity-10 shadow-lg'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                    }
                  `}
                  style={
                    isSelected
                      ? {
                          borderColor: algo.color,
                          backgroundColor: algo.color + '18',
                          boxShadow: `0 0 20px ${algo.color}33`,
                        }
                      : {}
                  }
                >
                  {isSelected && (
                    <div
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: algo.color }}
                    >
                      ✓
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-black"
                      style={{ backgroundColor: algo.color + '33', color: algo.color }}
                    >
                      {algo.id === 'bfs' ? 'B' : algo.id === 'dfs' ? 'D' : 'H'}
                    </div>
                    <h3
                      className="font-bold text-base"
                      style={{ color: isSelected ? algo.color : '#e2e8f0' }}
                    >
                      {algo.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {algo.description}
                  </p>
                  {algo.id === 'hybrid' && (
                    <div
                      className="mt-3 text-xs px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: algo.color + '44',
                        backgroundColor: algo.color + '11',
                        color: algo.color,
                      }}
                    >
                      🔬 Proposed Algorithm — BFS + DFS with heuristic switching
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Preview when both selected */}
        {selectedScenario && selectedAlgorithm && (
          <div className="mb-8 max-w-xl mx-auto">
            <ScenarioInfo scenario={selectedScenario} algorithm={selectedAlgorithm} />
          </div>
        )}

        {/* Start Button */}
        <div className="flex justify-center">
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`
              px-12 py-4 rounded-xl font-bold text-lg transition-all duration-200
              ${
                canStart
                  ? 'bg-blue-600 hover:bg-blue-500 hover:scale-105 shadow-lg hover:shadow-blue-500/30 cursor-pointer'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {canStart
              ? `▶ Run Simulation — ${SCENARIOS.find((s) => s.id === selectedScenario)?.name} + ${ALGORITHMS.find((a) => a.id === selectedAlgorithm)?.name}`
              : 'Select a Scenario and Algorithm to Continue'}
          </button>
        </div>
      </main>
    </div>
  );
};
