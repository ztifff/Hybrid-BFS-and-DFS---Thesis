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

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState('');
  const [saveDefaultName, setSaveDefaultName] = useState('');

  const activeSteps = useMemo(() => {
    if (isComputing || !simResults) return { bfs: null, dfs: null, hybrid: null };

    const buildActiveStep = (algo: 'bfs' | 'dfs' | 'hybrid') => {
      const steps = simResults[algo].steps;
      if (!steps || steps.length === 0) return null;

      const targetStepIndex = Math.min(Math.max(0, stepIndex - 1), steps.length - 1);
      const targetStep = steps[targetStepIndex];

      const aggregatedExplored: string[] = [];
      for (let i = 0; i <= targetStepIndex; i++) {
        if (steps[i].explored) {
          for (const id of steps[i].explored) {
            aggregatedExplored.push(id);
          }
        }
      }

      return { ...targetStep, explored: aggregatedExplored };
    };

    return {
      bfs: buildActiveStep('bfs'),
      dfs: buildActiveStep('dfs'),
      hybrid: buildActiveStep('hybrid'),
    };
  }, [isComputing, simResults, stepIndex]);

  const stopAnimation = useCallback(() => {
    if (animRef.current) {
      clearInterval(animRef.current);
      animRef.current = null;
    }
  }, []);

  const startAnimation = useCallback((speed = playbackSpeed) => {
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
    }, STEP_INTERVAL_MS / speed);
  }, [simResults, totalSteps, stopAnimation, playbackSpeed]);

  useEffect(() => {
    return () => stopAnimation();
  }, [stopAnimation]);

  const prevTotalStepsRef = useRef(totalSteps);

  useEffect(() => {
    const prevTotalSteps = prevTotalStepsRef.current;

    if (stepIndex > totalSteps) {
      // Clamp down if max steps shrinks
      setStepIndex(totalSteps);
      if (status === 'running') {
        stopAnimation();
        setStatus('done');
      }
    } else if (stepIndex === prevTotalSteps && totalSteps > prevTotalSteps && stepIndex > 0) {
      // Auto-forward to the new end if the user was already at the end and max steps expanded
      setStepIndex(totalSteps);
    } else if (stepIndex === totalSteps && status === 'running') {
      // Stop animation naturally when reaching the end
      stopAnimation();
      setStatus('done');
    }

    // Clear the 'done' state if the max timeline expanded past our playhead and we didn't auto-forward
    if (status === 'done' && stepIndex < totalSteps && !(stepIndex === prevTotalSteps && totalSteps > prevTotalSteps)) {
      setStatus('paused');
    }

    prevTotalStepsRef.current = totalSteps;
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

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (status === 'running') {
      startAnimation(newSpeed);
    }
  }, [status, startAnimation]);

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
    playbackSpeed,
    handleSpeedChange,
    openSaveModal,

    isHistoryModalOpen, setIsHistoryModalOpen,
    isSaveModalOpen, setIsSaveModalOpen,
    saveNameInput, setSaveNameInput,
    saveDefaultName, setSaveDefaultName
  };
}
