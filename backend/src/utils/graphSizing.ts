import { GraphEdge, GraphSizing, ScenarioGraph } from '../types';

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function parseGraphSizing(
  rawNodes: unknown,
  rawEdges: unknown
): GraphSizing | undefined {
  const nodes = Number(rawNodes);
  const edges = Number(rawEdges);

  if (!Number.isFinite(nodes) && !Number.isFinite(edges)) return undefined;

  return {
    nodes: Number.isFinite(nodes) ? clampInt(nodes, 6, 400) : 64,
    edges: Number.isFinite(edges) ? clampInt(edges, 4, 1600) : 96,
  };
}

export function resolveSizingValue(
  value: number | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  return clampInt(value ?? fallback, min, max);
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(1664525, state) + 1013904223;
    return (state >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: number): T[] {
  const rng = makeRng(seed);
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function reachesDestinations(graph: ScenarioGraph, edges: GraphEdge[]): boolean {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  if (!nodeIds.has(graph.sourceId)) return false;

  const destinations = graph.destinationIds.filter((id) => nodeIds.has(id));
  if (destinations.length === 0) return true;

  const adj = new Map<string, string[]>();
  graph.nodes.forEach((node) => adj.set(node.id, []));
  edges.forEach((edge) => {
    if (adj.has(edge.from) && nodeIds.has(edge.to)) {
      adj.get(edge.from)!.push(edge.to);
    }
  });

  const visited = new Set<string>([graph.sourceId]);
  const queue = [graph.sourceId];

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const next of adj.get(current) ?? []) {
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }

  return destinations.every((destination) => visited.has(destination));
}

function edgeKey(from: string, to: string): string {
  return `${from}->${to}`;
}

function cleanIdPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, '_');
}

interface EdgeFitOptions {
  edgeType: GraphEdge['type'];
  labelUnit: string;
  latencyBase?: number;
  latencySpread?: number;
  maxEdges?: number;
}

export function fitGraphEdgeCount(
  graph: ScenarioGraph,
  requestedEdges: number | undefined,
  seed: number,
  options: EdgeFitOptions
): ScenarioGraph {
  if (!Number.isFinite(requestedEdges)) return graph;

  const maxPossibleEdges = graph.nodes.length * Math.max(graph.nodes.length - 1, 0);
  const maxEdges = Math.min(options.maxEdges ?? maxPossibleEdges, maxPossibleEdges);
  const targetEdges = clampInt(requestedEdges!, graph.destinationIds.length, maxEdges);

  let edges = [...graph.edges];

  if (targetEdges < edges.length) {
    const removalOrder = shuffled(edges, seed + 17);

    for (const edge of removalOrder) {
      if (edges.length <= targetEdges) break;

      const candidateEdges = edges.filter((candidate) => candidate.id !== edge.id);
      if (reachesDestinations(graph, candidateEdges)) {
        edges = candidateEdges;
      }
    }
  }

  if (targetEdges > edges.length) {
    const rng = makeRng(seed + 31);
    const existing = new Set(edges.map((edge) => edgeKey(edge.from, edge.to)));
    const candidates: Array<{ from: string; to: string }> = [];

    for (const from of graph.nodes) {
      for (const to of graph.nodes) {
        if (from.id === to.id) continue;
        const key = edgeKey(from.id, to.id);
        if (!existing.has(key)) candidates.push({ from: from.id, to: to.id });
      }
    }

    for (const candidate of shuffled(candidates, seed + 43)) {
      if (edges.length >= targetEdges) break;
      const latency = (options.latencyBase ?? 2) + Math.floor(rng() * (options.latencySpread ?? 4));
      const id = `dyn_${cleanIdPart(candidate.from)}_${cleanIdPart(candidate.to)}_${edges.length}`;

      edges.push({
        id,
        from: candidate.from,
        to: candidate.to,
        latency,
        label: `${latency}${options.labelUnit}`,
        type: options.edgeType,
      });
      existing.add(edgeKey(candidate.from, candidate.to));
    }
  }

  return { ...graph, edges };
}
