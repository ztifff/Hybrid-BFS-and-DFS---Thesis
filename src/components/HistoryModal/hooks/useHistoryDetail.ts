import { useMemo } from 'react';
import { getAdaptabilityScore, getMemoryInMB, getPathOptimality } from '../../../utils/metricsHelpers';
import { HistoryEntry, AlgorithmKey, MOVEMENT_PROFILES, BLOCK_ICON, CLEAR_ICON } from '../types';
import { extractPrimitive, getEntryResults, resolveMapId } from '../historyUtils';

export type AlgoData = {
  time: number;
  nodes: number;
  distance: number;
  memory: string | number;
  optimality: string | number;
  completion: string;
  adaptability: string | number;
  success: boolean;
  reason?: string;
};

export type ScoredAlgo = {
  key: AlgorithmKey;
  label: string;
  color: string;
  data: AlgoData;
  score: number;
};

export function useHistoryDetail(
  entry: HistoryEntry | null,
  historyTimelineStep: number,
) {
  return useMemo(() => {
    if (!entry) return null;

    const results = getEntryResults(entry);
    const entryActiveAlgorithms = entry.metadata?.activeAlgorithms ?? { bfs: true, dfs: true, hybrid: true };

    const baseGraph =
      results.hybrid?.graph || results.bfs?.graph || results.dfs?.graph || entry.simResult?.graph;

    const allEvents =
      results.hybrid?.dynamicEvents ||
      results.bfs?.dynamicEvents ||
      results.dfs?.dynamicEvents ||
      entry.simResult?.dynamicEvents ||
      [];

    const maxEventStep = allEvents.length > 0 ? Math.max(...allEvents.map(e => e.stepIndex)) : 0;
    const maxSteps = Math.max(
      results.bfs?.steps?.length || 0,
      results.dfs?.steps?.length || 0,
      results.hybrid?.steps?.length || 0,
      entry.simResult?.steps?.length || 0
    );
    const ultimateMax = Math.max(maxEventStep, maxSteps);
    const currentStep =
      historyTimelineStep === -1 ? ultimateMax : Math.min(historyTimelineStep, ultimateMax);

    const blockedNodeIds = new Set<string>();
    allEvents.forEach(e => {
      if (e.stepIndex <= currentStep && e.blocked) blockedNodeIds.add(e.nodeId);
    });

    const shelfBoxCounts = (() => {
      const counts = new Map<string, number>();
      if (entry.scenario !== 'robotics' || !baseGraph) return counts;
      const allDestIds = baseGraph.destinationIds || [];
      allDestIds.forEach(nodeId => counts.set(nodeId, 6));
      return counts;
    })();

    const getData = (algo: AlgorithmKey): AlgoData | null => {
      const res = results[algo];
      if (!res) return null;
      const metrics = res.metrics || res;
      if (metrics.totalLatency === undefined && metrics.pathLength === undefined) return null;

      const actualDistance = Math.max(metrics.pathLength || 0, 0);
      const cRate =
        metrics.completionRate !== undefined ? `${metrics.completionRate.toFixed(1)}%` : '0%';

      return {
        time: metrics.timeElapsed || 0,
        nodes: metrics.nodesExplored || 0,
        distance: actualDistance,
        memory: getMemoryInMB(metrics.memoryUsed || 0),
        optimality: extractPrimitive(
          getPathOptimality(actualDistance, entry.optimalPathLength || 0)
        ),
        completion: cRate,
        adaptability: extractPrimitive(
          getAdaptabilityScore('done', metrics, algo, res.dynamicEvents || [])
        ),
        success: metrics.exitFound || false,
        reason: metrics.failureReason,
      };
    };

    const bfs = getData('bfs');
    const dfs = getData('dfs');
    const hyb = getData('hybrid');

    const computeScore = (d: AlgoData): number => {
      const maxTime = Math.max(
        entryActiveAlgorithms.bfs ? bfs?.time || 0 : 0,
        entryActiveAlgorithms.dfs ? dfs?.time || 0 : 0,
        entryActiveAlgorithms.hybrid ? hyb?.time || 0 : 0,
        0.001
      );
      const maxDist = Math.max(
        entryActiveAlgorithms.bfs ? bfs?.distance || 0 : 0,
        entryActiveAlgorithms.dfs ? dfs?.distance || 0 : 0,
        entryActiveAlgorithms.hybrid ? hyb?.distance || 0 : 0,
        1
      );
      const maxMem = Math.max(
        entryActiveAlgorithms.bfs ? bfs?.nodes || 0 : 0,
        entryActiveAlgorithms.dfs ? dfs?.nodes || 0 : 0,
        entryActiveAlgorithms.hybrid ? hyb?.nodes || 0 : 0,
        1
      );
      const speedScore = 1 - d.time / maxTime;
      const distScore = 1 - d.distance / maxDist;
      const memScore = 1 - d.nodes / maxMem;
      const adaptScore = (Number(d.adaptability) || 0) / 100;
      return speedScore * 0.25 + distScore * 0.35 + memScore * 0.2 + adaptScore * 0.2;
    };

    type AlgoEntry = { key: AlgorithmKey; label: string; color: string; data: AlgoData };
    const algoEntries: AlgoEntry[] = [
      ...(bfs && bfs.success && entryActiveAlgorithms.bfs
        ? [{ key: 'bfs' as AlgorithmKey, label: 'BFS', color: '#4ade80', data: bfs }]
        : []),
      ...(dfs && dfs.success && entryActiveAlgorithms.dfs
        ? [{ key: 'dfs' as AlgorithmKey, label: 'DFS', color: '#c084fc', data: dfs }]
        : []),
      ...(hyb && hyb.success && entryActiveAlgorithms.hybrid
        ? [{ key: 'hybrid' as AlgorithmKey, label: 'Hybrid BFS-DFS', color: '#fb923c', data: hyb }]
        : []),
    ];

    const scoredAlgos: ScoredAlgo[] = algoEntries
      .map(a => ({ ...a, score: computeScore(a.data) }))
      .sort((a, b) => b.score - a.score);

    const winner = scoredAlgos[0] ?? null;
    const runnerUp = scoredAlgos[1] ?? null;

    const resolvedMapId = resolveMapId(entry.metadata?.mapId, baseGraph?.nodes);
    const blockIcon =
      (BLOCK_ICON[entry.scenario ?? ''] ??
        (entry.metadata?.mapId === 'dama' ? '🔻' : '🔴')) ||
      '⛔';
    const clearIcon = CLEAR_ICON[entry.scenario ?? ''] ?? '✅';

    return {
      results,
      entryActiveAlgorithms,
      baseGraph,
      allEvents,
      maxEventStep,
      maxSteps,
      ultimateMax,
      currentStep,
      blockedNodeIds,
      shelfBoxCounts,
      bfs,
      dfs,
      hyb,
      scoredAlgos,
      winner,
      runnerUp,
      MOVEMENT_PROFILES,
      resolvedMapId,
      blockIcon,
      clearIcon,
    };
  }, [entry, historyTimelineStep]);
}
