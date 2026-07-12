import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MultiResultsLocal } from './useSimulationModel';

export type Status = 'idle' | 'running' | 'done' | 'paused';
const STEP_INTERVAL_MS = 60;

export function useSimulationController(model: {
  simResults: MultiResultsLocal | null;
  totalSteps: number;
  isComputing: boolean;
  history: any[];
  scenario: string;
  isCurrentSaved: boolean;
}) {
  const { simResults, totalSteps, isComputing, history, scenario, isCurrentSaved } = model;

  const [stepIndex, setStepIndex] = useState(0);
  const [status, setStatus] = useState<Status>('idle');
  const animRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveDefaultName, setSaveDefaultName] = useState('');

  const activeSteps = useMemo(() => {
    if (isComputing || !simResults) return { bfs: null, dfs: null, hybrid: null };

    const bfsTotal = simResults.bfs.steps.length;
    const dfsTotal = simResults.dfs.steps.length;
    const hybridTotal = simResults.hybrid.steps.length;

    const step = Math.max(0, stepIndex - 1);

    return {
      bfs: simResults.bfs.steps[Math.min(step, Math.max(bfsTotal - 1, 0))] ?? null,
      dfs: simResults.dfs.steps[Math.min(step, Math.max(dfsTotal - 1, 0))] ?? null,
      hybrid: simResults.hybrid.steps[Math.min(step, Math.max(hybridTotal - 1, 0))] ?? null,
    };
  }, [isComputing, simResults, stepIndex]);

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  }, []);

  const startAnimation = useCallback(() => {
    if (!simResults || totalSteps === 0) return;

    stopAnimation();
    setStatus('running');

    animRef.current = setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= totalSteps) {
          stopAnimation();
          setStatus('done');
          return prev;
        }
        return prev + 1;
      });
    }, STEP_INTERVAL_MS);
  }, [simResults, totalSteps, stopAnimation]);

  useEffect(() => {
    return () => stopAnimation();
  }, [stopAnimation]);

  useEffect(() => {
    if (stepIndex >= totalSteps && status === 'running') {
      stopAnimation();
      setStatus('done');
    }
  }, [stepIndex, totalSteps, status, stopAnimation]);

  const handleRun = () => {
    if (!simResults) return;
    setStepIndex(0);
    setStatus('idle');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        startAnimation();
      });
    });
  };

  const handleStepForward = () => {
    if (status === 'running') {
      stopAnimation();
      setStatus('paused');
    }
    setStepIndex((prev) => {
      const next = Math.min(prev + 1, totalSteps);
      if (next >= totalSteps) setStatus('done');
      else setStatus('paused');
      return next;
    });
  };

  const handleStepBackward = () => {
    if (status === 'running') {
      stopAnimation();
      setStatus('paused');
    }
    setStepIndex((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next === 0) setStatus('idle');
      else setStatus('paused');
      return next;
    });
  };

  const handlePause = () => {
    stopAnimation();
    setStatus('paused');
  };

  const handleResume = () => {
    if (stepIndex < totalSteps) startAnimation();
  };

  const handleReset = () => {
    stopAnimation();
    setStepIndex(0);
    setStatus('idle');
  };

  const handleSkipEnd = () => {
    stopAnimation();
    setStepIndex(totalSteps);
    setStatus('done');
  };

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

  return {
    stepIndex, setStepIndex,
    status, setStatus,
    activeSteps,
    stopAnimation,
    handleRun,
    handleStepForward,
    handleStepBackward,
    handlePause,
    handleResume,
    handleReset,
    handleSkipEnd,
    openSaveModal,
    
    isHistoryModalOpen, setIsHistoryModalOpen,
    isSaveModalOpen, setIsSaveModalOpen,
    saveNameInput, setSaveNameInput,
    saveDefaultName, setSaveDefaultName
  };
}
