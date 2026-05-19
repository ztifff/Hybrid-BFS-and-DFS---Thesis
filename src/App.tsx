import React, { useState } from 'react';
import { ScenarioType } from './types';
import { ScenarioPicker } from './components/ScenarioPicker';
import { SimulationView } from './components/SimulationView';

export default function App() {
  const [scenario, setScenario] = useState<ScenarioType | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // If the user has picked a scenario AND clicked start, show the simulation
  if (isSimulating && scenario) {
    return (
      <SimulationView 
        scenario={scenario} 
        onBack={() => setIsSimulating(false)} 
      />
    );
  }

  // Otherwise, show the scenario picker
  return (
    <ScenarioPicker
      selectedScenario={scenario}
      onSelectScenario={setScenario}
      onStart={() => setIsSimulating(true)}
    />
  );
}