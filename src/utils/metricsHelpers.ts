import type { PerformanceMetrics, AlgorithmType, DynamicEvent } from '../types';

export function getAdaptabilityScore(
  status: 'idle' | 'running' | 'done' | 'paused',
  metrics: PerformanceMetrics | null,
  algorithm: AlgorithmType,
  dynamicEvents?: DynamicEvent[]
): { score: number; label: string; color: string } {
  if (status !== 'done' || !metrics) return { score: 0, label: '-', color: '#64748b' };
  const eventCount = dynamicEvents?.length ?? 0;
  let score = metrics.exitFound ? 50 : 0;

  if (eventCount > 0) {
    // Scale bonus based on number of events handled
    const eventBonus = Math.min(40, eventCount * 10);
    score += metrics.exitFound ? eventBonus : Math.floor(eventBonus / 3);

    // Algorithm-specific bonuses for handling dynamic events
    if (algorithm === 'hybrid' && metrics.exitFound) score += 10;
    else if (algorithm === 'bfs' && metrics.exitFound) score += 5;
  } else {
    // No events: award based on successful completion
    score += metrics.exitFound ? 35 : 0;
  }

  // Path efficiency bonus (only if path was found and is reasonable)
  if (metrics.exitFound && metrics.pathLength > 0) {
    // Bonus based on path efficiency: shorter paths get higher bonus (max 10 points)
    const pathBonus = Math.max(0, Math.floor((50 - metrics.pathLength) / 5));
    score += Math.min(10, pathBonus);
  }

  score = Math.min(100, Math.max(0, score));

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
