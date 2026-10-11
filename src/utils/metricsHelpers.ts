import type { PerformanceMetrics, AlgorithmType, DynamicEvent } from '../types';

export function getAdaptabilityScore(
  status: 'idle' | 'running' | 'done' | 'paused',
  metrics: PerformanceMetrics | null,
  algorithm: AlgorithmType,
  dynamicEvents?: DynamicEvent[],
  stepIndex?: number,
  completionRate?: number
): { score: number; label: string; color: string } {
  if (!metrics || status === 'idle') return { score: 0, label: '-', color: '#64748b' };
  
  const currentEvents = (status === 'running' || status === 'paused') && stepIndex !== undefined
    ? dynamicEvents?.filter(e => e.stepIndex <= stepIndex)
    : dynamicEvents;

  const eventCount = currentEvents?.length ?? 0;
  
  // Use final exit metric, but we will scale its reward by the current completion rate
  const hasExit = metrics.exitFound;
  
  // Default to 100% if done or not provided, otherwise use the live completion rate
  const currentCompletion = (status === 'done' || completionRate === undefined) ? (hasExit ? 100 : 0) : completionRate;
  const completionRatio = currentCompletion / 100;

  // 1. Mission Completion Base (Max 40 points)
  let score = hasExit ? (40 * completionRatio) : 0;

  // 2. Dynamic Disruption Resilience (Max 35 points)
  if (eventCount > 0) {
    const eventBonus = Math.min(30, eventCount * 6);
    score += hasExit ? eventBonus : Math.floor(eventBonus / 3);
    if (algorithm === 'hybrid' && hasExit) score += 5;
    else if (algorithm === 'bfs' && hasExit) score += 2;
  } else {
    score += hasExit ? (25 * completionRatio) : 0;
    if (algorithm === 'hybrid' && hasExit) score += 5;
    else if (algorithm === 'bfs' && hasExit) score += 2;
  }

  // 3. Detour / Path Optimality Under Stress (Max 25 points)
  if (hasExit && metrics.pathLength > 0 && status === 'done') {
    const pathRatio = Math.max(0, (60 - metrics.pathLength) / 60);
    score += Math.min(25, Math.max(0, pathRatio * 25));
  }

  score = Math.min(100, Math.max(0, Math.round(score)));

  if (score >= 80) return { score, label: 'Great', color: '#22c55e' };
  if (score >= 60) return { score, label: 'Good', color: '#84cc16' };
  if (score >= 40) return { score, label: 'Fair', color: '#eab308' };
  return { score, label: 'Poor', color: '#ef4444' };
}

export function getPathOptimality(actualHops: number, optimalHops?: number): { ratio: number; label: string; color: string } {
  if (!optimalHops || optimalHops <= 0 || actualHops <= 0) return { ratio: 0, label: 'N/A', color: '#64748b' };
  
  const ratio = Math.min(1, optimalHops / actualHops); 
  const percentage = (ratio * 100).toFixed(1);
  if (ratio >= 0.95) return { ratio, label: `${percentage}%`, color: '#22c55e' };
  if (ratio >= 0.8) return { ratio, label: `${percentage}%`, color: '#84cc16' };
  if (ratio >= 0.6) return { ratio, label: `${percentage}%`, color: '#eab308' };
  return { ratio, label: `${percentage}%`, color: '#ef4444' };
}

export function getCompletionRate(explored: number, totalNodes?: number): { percentage: number; label: string } {
  if (!totalNodes || totalNodes === 0) return { percentage: 0, label: '0.0%' };
  const percentage = Math.min(100, (explored / totalNodes) * 100);
  return { percentage, label: `${percentage.toFixed(1)}%` };
}

export function getMemoryInMB(memoryKB: number): string {
  const memoryMB = memoryKB / 1024;
  return `${memoryMB.toFixed(3)} MB`;
}
