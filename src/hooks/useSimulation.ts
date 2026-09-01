import { useEffect } from 'react';
import { AlgorithmStep, GameAIBoard, GraphSize, GraphSizing, RobotAssignment, ScenarioGraph, ScenarioType, SimulationResult } from '../types';
import { HistoryEntry } from '../components/HistoryModal';
import { useSimulationModel, PendingNavigation } from './useSimulationModel';
import { useSimulationController } from './useSimulationController';

type MultiResults = {
  bfs: SimulationResult;
  dfs: SimulationResult;
  hybrid: SimulationResult;
};

// SimulationView historically used `simResults` with this shape.
export interface SimulationState {
  // Data
  currentGraph: ScenarioGraph | null;
  simResults: MultiResults | null;
  bfsResult: { pathLength: number } | null;
  history: HistoryEntry[];

  // Loading / computing state
  isGraphLoading: boolean;
  isComputing: boolean;

  // Animation state
  stepIndex: number;
  status: 'idle' | 'running' | 'done' | 'paused';
  totalSteps: number;

  // Derived animation slices (used by MetricsPanel/NetworkCanvas)
  activeSteps: {
    bfs: AlgorithmStep | null;
    dfs: AlgorithmStep | null;
    hybrid: AlgorithmStep | null;
  };

  // Save state
  isCurrentSaved: boolean;
  currentSavedId: string | null;

  // Configuration State
  gameBoard: GameAIBoard;
  setGameBoard: (board: GameAIBoard) => void;
  mapId: string;
  setMapId: (id: string) => void;
  graphSize: GraphSize;
  setGraphSize: (size: GraphSize) => void;
  syntheticSizing: GraphSizing;
  updateSyntheticSizing: (field: keyof GraphSizing, value: number) => void;
  sizingKey: string;
  networkRoutingMode: 'default' | 'device-to-device';
  setNetworkRoutingMode: (mode: 'default' | 'device-to-device') => void;
  sourceDevice: string;
  setSourceDevice: (device: string) => void;
  sourceDevices: string[];
  destinationDevices: string[];
  setDestinationDevices: (devices: string[]) => void;
  robotAssignments: RobotAssignment[];
  setRobotAssignments: (assignments: RobotAssignment[]) => void;

  // Actions
  handleRun: () => void;
  handleStepForward: () => void;
  handleStepBackward: () => void;
  handlePause: () => void;
  handleResume: () => void;
  handleReset: () => void;
  handleSkipEnd: () => void;
  handleRerollEvents: () => void;
  handleImportHistory: (entries: HistoryEntry[]) => void;

  // Modals
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  isSaveModalOpen: boolean;
  setIsSaveModalOpen: (open: boolean) => void;
  saveNameInput: string;
  setSaveNameInput: (name: string) => void;
  saveDefaultName: string;
  setSaveDefaultName: (name: string) => void;
  activeAlgorithms: { bfs: boolean; dfs: boolean; hybrid: boolean };
  setActiveAlgorithms: React.Dispatch<React.SetStateAction<{ bfs: boolean; dfs: boolean; hybrid: boolean }>>;
  confirmSaveResult: () => void;
  openSaveModal: () => void;
  handleDeleteHistory: (ids: string[]) => void;

  // Evacuation: user-selectable start point
  evacuationSourceId: string | null;
  setEvacuationSourceId: (id: string | null | ((prev: string | null) => string | null)) => void;

  // ── Extracted from SimulationView ──────────────────────────────────────────
  isEvacuationRealWorld: boolean;
  scenarioHistoryCount: number;
  shelfBoxCounts: Map<string, number> | undefined;
  generatedNodeCount: number;
  generatedEdgeCount: number;

  localNodesInput: string;
  setLocalNodesInput: (v: string) => void;
  localEdgesInput: string;
  setLocalEdgesInput: (v: string) => void;

  minAlgoWarning: boolean;
  toggleAlgorithm: (algo: 'bfs' | 'dfs' | 'hybrid') => void;

  pendingNavigation: PendingNavigation | null;
  setPendingNavigation: (nav: PendingNavigation | null) => void;
  requestBack: (status: string, saved: boolean) => void;
  requestMapChange: (newMapId: string, status: string, saved: boolean) => void;
  requestBoardChange: (boardId: GameAIBoard, status: string, saved: boolean) => void;
  requestReset: (onReset: () => void, status: string) => void;
  requestSkip: (onSkip: () => void, status: string) => void;
  requestReroll: (onReroll: () => void, status: string) => void;
  confirmPendingNavigation: () => void;

  stepNodesUp: () => void;
  stepNodesDown: () => void;
  stepEdgesUp: () => void;
  stepEdgesDown: () => void;

  requestSizingChange: (field: keyof GraphSizing, value: number, status: string, saved: boolean) => void;
  requestSizingStep: (action: 'nodesUp' | 'nodesDown' | 'edgesUp' | 'edgesDown', status: string, saved: boolean) => void;

  deliveryMode: 'anycast' | 'multicast';
  setDeliveryMode: (mode: 'anycast' | 'multicast') => void;
}

export type Status = 'idle' | 'running' | 'done' | 'paused';

export function useSimulation(params: { scenario: ScenarioType; onBack?: () => void }) {
  const { scenario, onBack } = params;

  // Initialize the Model (pass onBack so the model can call it from navigation handlers)
  const model = useSimulationModel(scenario, onBack);

  // Initialize the Controller
  const controller = useSimulationController(model);

  // Glue logic: Fetch run metrics and evaluated paths from the computing engine (Chunked)
  // This lives in the composer because it manipulates both Model (saving data) and Controller (stopping animations)
  useEffect(() => {
    let isMounted = true;

    const fetchGraphData = async () => {
      try {
        model.setIsComputing(true);
        model.setSavedSignatures([]);
        model.setCurrentSavedId(null);
        model.setBfsResult(null);
        controller.setStatus('idle');

        controller.setStepIndex(0);
        controller.stopAnimation();

        let currentOffset = 0;
        const limit = 1000;
        let keepFetching = true;
        let mergedResults: any = null;

        while (keepFetching && isMounted) {
          const requestBody = {
            scenario: model.scenario,
            mapId: model.mapId,
            seed: model.seed,
            graphSize: model.graphSize,
            ...((model.mapId === 'synthetic' || model.scenario === 'gameai') ? {
              sizing: {
                nodes: model.syntheticSizing.nodes,
                ...(model.syntheticSizing.edges > 0 ? { edges: model.syntheticSizing.edges } : {})
              }
            } : {}),
            ...(model.scenario === 'gameai' && model.gameBoard ? { gameBoard: model.gameBoard } : {}),
            ...(model.networkRoutingMode === 'device-to-device' ? {
              customSourceId: model.sourceDevice,
              customDestinationIds: model.destinationDevices,
              deliveryMode: model.deliveryMode
            } : {}),
            ...(scenario === 'robotics' ? {
              customRobotAssignments: model.robotAssignments,
              customSourceIds: model.sourceDevices,
              customDestinationIds: model.destinationDevices,
              deliveryMode: 'multicast'
            } : {}),
            ...(scenario === 'evacuation' && model.evacuationSourceId ? {
              customSourceId: model.evacuationSourceId
            } : {}),
            ...(scenario === 'traffic' ? {
              ...(model.trafficSourceId ? { customSourceId: model.trafficSourceId } : {}),
              ...(model.trafficDestinationIds.length > 0 ? { customDestinationIds: model.trafficDestinationIds } : {})
            } : {}),
            ...(scenario === 'gameai' && model.gameAISourceId ? {
              customSourceId: model.gameAISourceId
            } : {})
          };

          const response = await fetch(`https://backend-1e4y.onrender.com/api/simulation/run?offset=${currentOffset}&limit=${limit}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
          const json = await response.json();
          if (!isMounted) return;

          const { results, optimalPathLength } = json.data;

          if (!mergedResults) {
            mergedResults = results;
          } else {
            mergedResults.bfs.steps.push(...results.bfs.steps);
            mergedResults.dfs.steps.push(...results.dfs.steps);
            mergedResults.hybrid.steps.push(...results.hybrid.steps);
            mergedResults.bfs.metrics = results.bfs.metrics;
            mergedResults.dfs.metrics = results.dfs.metrics;
            mergedResults.hybrid.metrics = results.hybrid.metrics;
            mergedResults.bfs.meta = results.bfs.meta;
          }

          const maxStepsInChunk = Math.max(
            results.bfs.steps.length,
            results.dfs.steps.length,
            results.hybrid.steps.length
          );

          model.setSimResults({ ...mergedResults });
          if (optimalPathLength !== undefined && optimalPathLength > 0) {
            model.setBfsResult({ pathLength: optimalPathLength });
          }

          const isDone = !results.bfs.meta?.hasMore && !results.dfs.meta?.hasMore && !results.hybrid.meta?.hasMore;

          if (isDone || maxStepsInChunk === 0) {
            keepFetching = false;
            model.setIsComputing(false);
          } else {
            currentOffset += limit;
          }
        }
      } catch (err) {
        console.error('Simulation fetch failed:', err);
        if (isMounted) {
          model.setIsComputing(false);
          controller.setStatus('idle');
        }
      }
    };

    fetchGraphData();

    return () => {
      isMounted = false;
      controller.stopAnimation();
    };
  }, [scenario, model.mapId, model.seed, model.gameBoard, model.graphSize, model.syntheticSizing, model.networkRoutingMode, model.sourceDevice, model.destinationDevices, model.deliveryMode, model.evacuationSourceId, model.trafficSourceId, JSON.stringify(model.trafficDestinationIds), model.gameAISourceId, JSON.stringify(model.robotAssignments), controller.stopAnimation]);

  // ── Block page refresh/close when unsaved or running ──────────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if ((controller.status === 'done' && !model.isCurrentSaved) ||
        controller.status === 'running' ||
        controller.status === 'paused') {
        e.preventDefault();
        e.returnValue = ''; // Standard way to trigger the browser's confirmation dialog
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [controller.status, model.isCurrentSaved]);

  // Wrapper for confirmSaveResult to inject controller state
  const confirmSaveResult = () => {
    model.confirmSaveResult();
  };

  return {
    // Data
    currentGraph: model.currentGraph,
    simResults: model.simResults,
    bfsResult: model.bfsResult,
    history: model.history,

    // Loading / Computing
    isGraphLoading: model.isGraphLoading,
    isComputing: model.isComputing,

    // Animation state
    stepIndex: controller.stepIndex,
    status: controller.status,
    totalSteps: model.totalSteps,
    activeSteps: controller.activeSteps,

    // History & State
    isCurrentSaved: model.isCurrentSaved,
    currentSavedId: model.currentSavedId,

    // Config
    gameBoard: model.gameBoard,
    setGameBoard: model.setGameBoard,
    mapId: model.mapId,
    setMapId: model.setMapId,
    graphSize: model.graphSize,
    setGraphSize: model.setGraphSize,
    syntheticSizing: model.syntheticSizing,
    updateSyntheticSizing: model.updateSyntheticSizing,
    sizingKey: model.sizingKey,
    networkRoutingMode: model.networkRoutingMode,
    setNetworkRoutingMode: model.setNetworkRoutingMode,
    sourceDevice: model.sourceDevice,
    setSourceDevice: model.setSourceDevice,
    sourceDevices: model.sourceDevices,
    destinationDevices: model.destinationDevices,
    setDestinationDevices: model.setDestinationDevices,
    robotAssignments: model.robotAssignments,
    setRobotAssignments: model.setRobotAssignments,
    deliveryMode: model.deliveryMode,
    setDeliveryMode: model.setDeliveryMode,

    // Actions
    handleRun: controller.handleRun,
    handleStepForward: controller.handleStepForward,
    handleStepBackward: controller.handleStepBackward,
    handlePause: controller.handlePause,
    handleResume: controller.handleResume,
    handleReset: controller.handleReset,
    handleSkipEnd: controller.handleSkipEnd,
    playbackSpeed: controller.playbackSpeed,
    handleSpeedChange: controller.handleSpeedChange,
    handleRerollEvents: model.handleRerollEvents,
    handleImportHistory: model.handleImportHistory,

    // Modals
    isHistoryModalOpen: model.isHistoryModalOpen,
    setIsHistoryModalOpen: model.setIsHistoryModalOpen,
    isSaveModalOpen: model.isSaveModalOpen,
    setIsSaveModalOpen: model.setIsSaveModalOpen,
    saveNameInput: model.saveNameInput,
    setSaveNameInput: model.setSaveNameInput,
    saveDefaultName: model.saveDefaultName,
    setSaveDefaultName: model.setSaveDefaultName,
    activeAlgorithms: model.activeAlgorithms,
    setActiveAlgorithms: model.setActiveAlgorithms,
    confirmSaveResult,
    openSaveModal: model.openSaveModal,
    handleDeleteHistory: model.handleDeleteHistory,

    // Evacuation: user-selectable start point (city + building maps)
    evacuationSourceId: model.evacuationSourceId,
    setEvacuationSourceId: model.setEvacuationSourceId,

    // Traffic: user-selectable endpoints
    trafficSourceId: model.trafficSourceId,
    setTrafficSourceId: model.setTrafficSourceId,
    trafficDestinationIds: model.trafficDestinationIds,
    setTrafficDestinationIds: model.setTrafficDestinationIds,

    // Game AI: user-selectable starting point (first row nodes)
    gameAISourceId: model.gameAISourceId,
    setGameAISourceId: model.setGameAISourceId,

    // ── Extracted from SimulationView ──────────────────────────────────────────
    isEvacuationRealWorld: model.isEvacuationRealWorld,
    scenarioHistoryCount: model.scenarioHistoryCount,
    shelfBoxCounts: model.shelfBoxCounts,
    generatedNodeCount: model.generatedNodeCount,
    generatedEdgeCount: model.generatedEdgeCount,

    localNodesInput: model.localNodesInput,
    setLocalNodesInput: model.setLocalNodesInput,
    localEdgesInput: model.localEdgesInput,
    setLocalEdgesInput: model.setLocalEdgesInput,

    minAlgoWarning: model.minAlgoWarning,
    toggleAlgorithm: model.toggleAlgorithm,

    pendingNavigation: model.pendingNavigation,
    setPendingNavigation: model.setPendingNavigation,
    requestBack: model.requestBack,
    requestMapChange: model.requestMapChange,
    requestBoardChange: model.requestBoardChange,
    requestReset: model.requestReset,
    requestSkip: model.requestSkip,
    requestReroll: model.requestReroll,
    confirmPendingNavigation: model.confirmPendingNavigation,
    requestSizingChange: model.requestSizingChange,
    requestSizingStep: (action: 'nodesUp' | 'nodesDown' | 'edgesUp' | 'edgesDown', status: string, saved: boolean) => {
      if (status === 'running' || status === 'paused') {
        model.setPendingNavigation({ type: 'sizing_step', action, reason: 'inprogress' });
      } else if (status === 'done' && !saved) {
        model.setPendingNavigation({ type: 'sizing_step', action, reason: 'unsaved' });
      } else {
        if (action === 'nodesUp') model.stepNodesUp();
        else if (action === 'nodesDown') model.stepNodesDown();
        else if (action === 'edgesUp') model.stepEdgesUp();
        else if (action === 'edgesDown') model.stepEdgesDown();
      }
    },

    stepNodesUp: model.stepNodesUp,
    stepNodesDown: model.stepNodesDown,
    stepEdgesUp: model.stepEdgesUp,
    stepEdgesDown: model.stepEdgesDown,
  };
}
