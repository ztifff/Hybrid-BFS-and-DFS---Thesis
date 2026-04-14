import React, { useState } from 'react';
import { ScenarioType, AlgorithmType } from './types';
import { ScenarioPicker } from './components/ScenarioPicker';
import { SimulationView } from './components/SimulationView';

type AppView = 'picker' | 'simulation';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('picker');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioType | null>(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType | null>(null);

  const handleStart = () => {
    if (selectedScenario && selectedAlgorithm) {
      setView('simulation');
    }
  };

  const handleBack = () => {
    setView('picker');
  };

  if (view === 'simulation' && selectedScenario && selectedAlgorithm) {
    return (
      <SimulationView
        scenario={selectedScenario}
        algorithm={selectedAlgorithm}
        onBack={handleBack}
      />
    );
  }

  return (
    <ScenarioPicker
      selectedScenario={selectedScenario}
      selectedAlgorithm={selectedAlgorithm}
      onSelectScenario={setSelectedScenario}
      onSelectAlgorithm={setSelectedAlgorithm}
      onStart={handleStart}
    />
  );
};

export default App;
