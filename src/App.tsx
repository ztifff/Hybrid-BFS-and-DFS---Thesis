import { useState } from 'react';
import { ScenarioType, AlgorithmType } from './types';
import { ScenarioPicker } from './components/ScenarioPicker';
import { SimulationView } from './components/SimulationView';

type AppState =
  | { screen: 'picker' }
  | { screen: 'simulation'; scenario: ScenarioType; algorithm: AlgorithmType };

export default function App() {
  const [appState, setAppState] = useState<AppState>({ screen: 'picker' });

  if (appState.screen === 'simulation') {
    return (
      <SimulationView
        scenario={appState.scenario}
        algorithm={appState.algorithm}
        onBack={() => setAppState({ screen: 'picker' })}
      />
    );
  }

  return (
    <ScenarioPicker
      onStart={(scenario, algorithm) =>
        setAppState({ screen: 'simulation', scenario, algorithm })
      }
    />
  );
}
