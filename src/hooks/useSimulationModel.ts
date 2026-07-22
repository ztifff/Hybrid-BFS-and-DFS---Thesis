import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GameAIBoard, GraphSizing, RobotAssignment, ScenarioGraph, ScenarioType, SimulationResult } from '../types';
import { loadLocalHistory, persistLocalHistory } from '../utils/historyHelpers';
import { HistoryEntry } from '../components/HistoryModal';

export type MultiResultsLocal = {
  bfs: SimulationResult;
  dfs: SimulationResult;
  hybrid: SimulationResult;
};

const DEFAULT_SYNTHETIC_SIZING: Record<ScenarioType, GraphSizing> = {
  network: { nodes: 28, edges: 44 },
  robotics: { nodes: 56, edges: 63 },
  traffic: { nodes: 36, edges: 65 },
  evacuation: { nodes: 43, edges: 81 },
  gameai: { nodes: 66, edges: 339 },
};

const MIN_SYNTHETIC_NODES: Record<ScenarioType, number> = {
  network: 7,
  robotics: 10,
  traffic: 9,
  evacuation: 10,
  gameai: 18,
};

const MAX_SYNTHETIC_NODES: Record<ScenarioType, number> = {
  network: 220,
  robotics: 220,
  traffic: 220,
  evacuation: 220,
  gameai: 220,
};

const clampSizing = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, Math.round(value)));

export function useSimulationModel(scenario: ScenarioType) {
  // Configuration State
  const [gameBoard, setGameBoard] = useState<GameAIBoard>('dama');
  const [seed, setSeed] = useState(() => Date.now());
  const [mapId, setMapId] = useState<string>('synthetic');
  const [graphSize, setGraphSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [syntheticSizingByScenario, setSyntheticSizingByScenario] = useState(DEFAULT_SYNTHETIC_SIZING);

  // Network Specific State (Device-to-Device Mode)
  const [networkRoutingMode, setNetworkRoutingMode] = useState<'default' | 'device-to-device'>('default');
  const [sourceDevice, setSourceDevice] = useState<string>('sales_pc1');
  const [destinationDevices, setDestinationDevices] = useState<string[]>(['fin_pc1']);
  const [deliveryMode, setDeliveryMode] = useState<'anycast' | 'multicast'>('anycast');

  // ✅ Multi-Agent Robotics: Per-robot destination assignments
  const [robotAssignments, setRobotAssignments] = useState<RobotAssignment[]>([]);

  // Derived: sourceDevices and destinationDevices from robotAssignments
  // IMPORTANT: wrapped in useMemo so they maintain referential stability across renders.
  // Without this, a new array reference is created on every render, causing useEffect
  // dependency checks to fire continuously (infinite loop / blinking resync).
  const sourceDevices = useMemo(
    () => robotAssignments.map(r => r.robotId),
    [robotAssignments]
  );
  const destinationDevices_robotics = useMemo(
    () => [...new Set(robotAssignments.flatMap(r => r.destinations))],
    [robotAssignments]
  );

  const syntheticSizing = syntheticSizingByScenario[scenario];
  const updateSyntheticSizing = useCallback((field: keyof GraphSizing, rawValue: number) => {
    const min = field === 'nodes' ? MIN_SYNTHETIC_NODES[scenario] : 4;
    const max = field === 'nodes' ? MAX_SYNTHETIC_NODES[scenario] : 1600;

    setSyntheticSizingByScenario((previous) => ({
      ...previous,
      [scenario]: {
        ...previous[scenario],
        [field]: clampSizing(rawValue, min, max),
      },
    }));
  }, [scenario]);

  const handleRerollEvents = () => {
    setSeed(Date.now());
  };

  // Data State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentGraph, setCurrentGraph] = useState<ScenarioGraph | null>(null);
  const [isGraphLoading, setIsGraphLoading] = useState(true);
  const [simResults, setSimResults] = useState<MultiResultsLocal | null>(null);
  const [bfsResult, setBfsResult] = useState<{ pathLength: number } | null>(null);
  const [isComputing, setIsComputing] = useState(true);
  
  const [isCurrentSaved, setIsCurrentSaved] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);

  // Modals
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveDefaultName, setSaveDefaultName] = useState('');

  const totalSteps = useMemo(() => {
    if (!simResults) return 0;
    return Math.max(
      simResults.bfs?.steps?.length ?? 0,
      simResults.dfs?.steps?.length ?? 0,
      simResults.hybrid?.steps?.length ?? 0
    );
  }, [simResults]);

  // DB / History Logic
  const loadHistory = useCallback(async () => {
    try {
      const allScenarios: string[] = ['network', 'robotics', 'traffic', 'evacuation', 'gameai'];
      const allEntries: HistoryEntry[] = [];
      for (const sc of allScenarios) {
        const entries = await loadLocalHistory(sc);
        entries.forEach((e) => {
          if (!allEntries.some((x) => x.id === e.id)) allEntries.push(e);
        });
      }
      allEntries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(allEntries);
    } catch (err) {
      console.error('Failed to load local history', err);
      setHistory([]);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleDeleteHistory = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    const updatedHistory = history.filter((h) => !ids.includes(h.id));
    const allScenarios: string[] = ['network', 'robotics', 'traffic', 'evacuation', 'gameai'];
    for (const sc of allScenarios) {
      persistLocalHistory(sc, updatedHistory.filter((h) => h.scenario === sc)).catch((err) => {
        console.error('Failed to update local history after delete:', err);
      });
    }
    setHistory(updatedHistory);
    if (currentSavedId && ids.includes(currentSavedId)) {
      setIsCurrentSaved(false);
      setCurrentSavedId(null);
    }
  }, [history, currentSavedId]);

  const handleImportHistory = useCallback((entries: HistoryEntry[]) => {
    if (!entries || entries.length === 0) return;
    const existingIds = new Set(history.map((h) => h.id));
    const newEntries = entries.filter((e) => !existingIds.has(e.id));
    const merged = [...newEntries, ...history];
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const allScenarios: string[] = ['network', 'robotics', 'traffic', 'evacuation', 'gameai'];
    for (const sc of allScenarios) {
      persistLocalHistory(sc, merged.filter((h) => h.scenario === sc)).catch((err) => {
        console.error('Failed to persist imported history for', sc, err);
      });
    }
    setHistory(merged);
  }, [history]);

  const openSaveModal = useCallback(() => {
    if (!simResults || isCurrentSaved) return;
    const maxRun = history
      .filter((h) => h.scenario === scenario)
      .reduce((max, h) => Math.max(max, h.runNumber), 0);

    const nextRunNumber = maxRun + 1;
    const defaultName = `Multi-Alg Trial #${nextRunNumber}`;

    setSaveDefaultName(defaultName);
    setSaveNameInput(defaultName);
    setIsSaveModalOpen(true);
  }, [simResults, isCurrentSaved, history, scenario]);

  const confirmSaveResult = useCallback(() => {
    if (!simResults || !currentGraph) return;
    const maxRun = history.filter((h) => h.scenario === scenario).reduce((max, h) => Math.max(max, h.runNumber), 0);
    const thisRunNumber = maxRun + 1;
    const finalName = saveNameInput.trim() === '' ? saveDefaultName : saveNameInput.trim();

    const compressedSimResult: MultiResultsLocal = {
      bfs: {
        ...simResults.bfs,
        graph: null as any,
        steps: simResults.bfs.steps.length > 0 ? [simResults.bfs.steps[simResults.bfs.steps.length - 1]] : []
      },
      dfs: {
        ...simResults.dfs,
        graph: null as any,
        steps: simResults.dfs.steps.length > 0 ? [simResults.dfs.steps[simResults.dfs.steps.length - 1]] : []
      },
      hybrid: {
        ...simResults.hybrid,
        steps: simResults.hybrid.steps.length > 0 ? [simResults.hybrid.steps[simResults.hybrid.steps.length - 1]] : []
      }
    };

    const newEntryId = Date.now().toString();
    const newEntry: HistoryEntry = {
      id: newEntryId,
      runNumber: thisRunNumber,
      name: finalName,
      algorithm: 'hybrid',
      scenario,
      simResult: null as any,
      multiResults: compressedSimResult,
      optimalPathLength: bfsResult?.pathLength || 1,
      totalNodes: currentGraph.nodes.length,
      timestamp: new Date()
    };

    const updatedHistory = [newEntry, ...history.filter((h) => h.id !== newEntry.id)];
    persistLocalHistory(scenario, updatedHistory.filter((h) => h.scenario === scenario)).catch((err) => {
      alert('Failed to save to database. IndexedDB write failed.');
      console.warn('IndexedDB write failed:', err);
    });
    
    setHistory(updatedHistory);
    setIsCurrentSaved(true);
    setCurrentSavedId(newEntryId);
    setIsSaveModalOpen(false);
  }, [simResults, currentGraph, history, scenario, bfsResult, saveNameInput, saveDefaultName]);

  // Fetch API logic
  useEffect(() => {
    let isMounted = true;
    const fetchGraphStructure = async () => {
      try {
        setIsGraphLoading(true);
        const graphParams = new URLSearchParams({
          scenario,
          mapId,
          graphSize,
          seed: seed.toString()
        });

        if (mapId === 'synthetic') {
          graphParams.set('targetNodes', String(syntheticSizing.nodes));
          graphParams.set('targetEdges', String(syntheticSizing.edges));
        }

        if (scenario === 'gameai') graphParams.set('gameBoard', gameBoard);
        if (networkRoutingMode === 'device-to-device' && (mapId === 'companybusiness' || mapId === 'campus')) {
          graphParams.set('customSourceId', sourceDevice);
          graphParams.set('customDestinationIds', JSON.stringify(destinationDevices));
        }

        if (scenario === 'robotics') {
          graphParams.set('customSourceIds', JSON.stringify(sourceDevices));
          graphParams.set('customDestinationIds', JSON.stringify(destinationDevices_robotics));
        }

        const response = await fetch(`api/network/graph?${graphParams}`);
        if (!response.ok) throw new Error(`Graph API Error: ${response.statusText}`);
        const json = await response.json();

        if (isMounted) {
          setCurrentGraph(json.data);
          setIsGraphLoading(false);
        }
      } catch (err) {
        console.error('Failed to fetch graph layout from backend:', err);
        if (isMounted) setIsGraphLoading(false);
      }
    };
    fetchGraphStructure();
    return () => { isMounted = false; };
  }, [scenario, mapId, gameBoard, graphSize, seed, syntheticSizing.nodes, syntheticSizing.edges, networkRoutingMode, sourceDevice, sourceDevices, destinationDevices, destinationDevices_robotics]);
  // Synchronize custom endpoints if the map changes or if they are invalid
  useEffect(() => {
    if (scenario === 'robotics' && currentGraph && robotAssignments.length === 0) {
      // Pick a default robot (source) and at least 2 default destinations from the graph
      const defaultRobot = currentGraph.sourceIds?.[0] || currentGraph.sourceId || currentGraph.nodes.find(n => n.type === 'depot' || n.id.includes('Robot'))?.id;
      
      const defaultDests = currentGraph.destinationIds && currentGraph.destinationIds.length >= 2
        ? currentGraph.destinationIds.slice(0, 2)
        : currentGraph.nodes.filter(n => n.type === 'shelf' || n.type === 'delivery_bay' || n.id.includes('nurse') || n.id.includes('air_pressure')).slice(0, 2).map(n => n.id);
      
      if (defaultRobot && defaultDests.length > 0) {
        setRobotAssignments([{ robotId: defaultRobot, destinations: defaultDests }]);
      }
    }
    
    if (networkRoutingMode === 'device-to-device' && currentGraph) {
      let currentSource = sourceDevice;
      const validSource = currentGraph.nodes.some(n => n.id === currentSource);
      const endpoints = currentGraph.nodes.filter(n => mapId === 'campus' ? n.type === 'access_point' : (n.type === 'access_point' || n.type === 'server'));

      
      if (!validSource && endpoints.length > 0) {
        currentSource = endpoints[0].id;
        setSourceDevice(currentSource);
      }
      
      const validDestinations = destinationDevices.filter(d => currentGraph.nodes.some(n => n.id === d));
      
      // Ensure at least 2 destinations are selected (if available) so it doesn't default to empty
      const availableDests = endpoints.filter(e => e.id !== currentSource && !validDestinations.includes(e.id));
      const needed = 2 - validDestinations.length;
      
      if (needed > 0 && availableDests.length > 0) {
        const newDests = [...validDestinations, ...availableDests.slice(0, needed).map(e => e.id)];
        setDestinationDevices(newDests);
      } else if (validDestinations.length !== destinationDevices.length) {
        setDestinationDevices(validDestinations);
      }
    }
  }, [currentGraph, networkRoutingMode, sourceDevice, destinationDevices, mapId]);

  // Synchronize robotics robot assignments if the map changes
  const roboticsInitializedMap = useRef<string | null>(null);

  useEffect(() => {
    if (scenario === 'robotics' && mapId !== 'synthetic' && currentGraph) {
      const depots = currentGraph.nodes.filter(n => n.type === 'depot').map(n => n.id);
      const shelves = currentGraph.nodes.filter(n => n.type === 'shelf').map(n => n.id);

      if (roboticsInitializedMap.current !== mapId) {
        // Initial setup for this map — each depot gets its own assignment with no destinations yet
        const initialAssignments: RobotAssignment[] = depots.map(depotId => ({
          robotId: depotId,
          destinations: [],
        }));
        setRobotAssignments(initialAssignments);
        roboticsInitializedMap.current = mapId;
      } else {
        // Cleanup: remove depots that no longer exist, remove destinations that no longer exist
        setRobotAssignments(prev => {
          const cleaned = prev
            .filter(a => depots.includes(a.robotId))
            .map(a => ({
              ...a,
              destinations: a.destinations.filter(d => shelves.includes(d)),
              priorityDest: a.priorityDest && shelves.includes(a.priorityDest) ? a.priorityDest : undefined,
            }));
          return JSON.stringify(cleaned) !== JSON.stringify(prev) ? cleaned : prev;
        });
      }
    } else {
      roboticsInitializedMap.current = null;
    }
  }, [currentGraph, scenario, mapId]);

  return {
    scenario,
    gameBoard, setGameBoard,
    seed, setSeed, handleRerollEvents,
    mapId, setMapId,
    graphSize, setGraphSize,
    syntheticSizing, updateSyntheticSizing,
    networkRoutingMode, setNetworkRoutingMode,
    sourceDevice, setSourceDevice,
    // Derived robot source IDs (robotics only)
    sourceDevices,
    // Scenario-aware: robotics uses derived destinations, all other scenarios use network state
    destinationDevices: (scenario === 'robotics' && mapId !== 'synthetic')
      ? destinationDevices_robotics
      : destinationDevices,
    setDestinationDevices,
    // Per-robot assignment state (robotics only)
    robotAssignments, setRobotAssignments,
    deliveryMode, setDeliveryMode,
    
    history, handleDeleteHistory, handleImportHistory, confirmSaveResult, openSaveModal,
    isCurrentSaved, setIsCurrentSaved,
    currentSavedId, setCurrentSavedId,

    isHistoryModalOpen, setIsHistoryModalOpen,
    isSaveModalOpen, setIsSaveModalOpen,
    saveNameInput, setSaveNameInput,
    saveDefaultName, setSaveDefaultName,
    

    currentGraph, isGraphLoading,
    simResults, setSimResults,
    bfsResult, setBfsResult,
    isComputing, setIsComputing,
    totalSteps
  };
}
