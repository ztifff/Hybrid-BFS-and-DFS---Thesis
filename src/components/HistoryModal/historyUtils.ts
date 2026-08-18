import { ScenarioGraph } from '../../types';
import { HistoryEntry, HistoryResults, AlgorithmKey } from './types';

/** Safely extract a primitive from a helper return that might be an object. */
export const extractPrimitive = (val: any): string | number => {
  if (val === null || val === undefined) return 'N/A';
  if (typeof val === 'object') {
    return val.score ?? val.value ?? val.label ?? val.text ?? (Object.values(val)[0] as string | number);
  }
  return val;
};

export const isMultiAlgorithmResult = (value: unknown): value is HistoryResults => {
  const result = value as HistoryResults | null;
  return Boolean(result && typeof result === 'object' && (result.bfs || result.dfs || result.hybrid));
};

export const getEntryResults = (entry: HistoryEntry): HistoryResults => {
  if (entry.multiResults) return entry.multiResults;
  if (isMultiAlgorithmResult(entry.simResult as unknown)) return entry.simResult as unknown as HistoryResults;

  const algorithm = entry.algorithm?.toLowerCase() as AlgorithmKey;
  if (algorithm === 'bfs' || algorithm === 'dfs' || algorithm === 'hybrid') {
    return { [algorithm]: entry.simResult } as HistoryResults;
  }
  return { hybrid: entry.simResult };
};

/**
 * Infer the mapId from graph node signatures when entry.metadata.mapId is absent.
 * The duplicated inline ternary chain in the original file is extracted here once.
 */
export const resolveMapId = (
  metaMapId: string | undefined,
  nodes: ScenarioGraph['nodes'] | undefined
): string => {
  if (metaMapId) return metaMapId;
  if (!nodes) return 'synthetic';

  if (nodes.some(n => n.id.includes('boys') || n.id.includes('girls') || n.label?.includes('PC-PT'))) return 'campus';
  if (nodes.some(n => n.id.toLowerCase().includes('finance') || n.id.toLowerCase().includes('sales'))) return 'companybusiness';
  if (nodes.some(n => n.id.includes('exit_south_main') || n.id.includes('stair_main_') || n.id.includes('l1_spine') || n.id.includes('elev_n_'))) return 'synthetic';
  if (nodes.some(n => n.id.includes('lv_hapchan') || n.id.includes('s_bacolod') || n.id.includes('th_w') || n.label?.includes('Kuya J'))) return 'city';
  if (nodes.some(n => n.buildingId === 'GL' || n.id.toLowerCase().includes('supermarket') || n.id.toLowerCase().includes('atrium') || n.id.toLowerCase().includes('dept_store'))) return 'building';
  if (nodes.some(n => n.label?.includes('nurse') || n.label?.includes('air_pressure') || n.buildingId === 'L1' || n.buildingId === 'clinic')) return 'clinic';
  if (nodes.some(n => n.id.includes('shelf_f') || n.id.includes('dest_desk_a') || n.id.includes('shelf_m'))) return 'awsWarehouse';
  return 'synthetic';
};

export const getEvacuationMapName = (id: any): string => {
  if (!id || typeof id !== 'string') return String(id || 'Unknown');
  if (id === 'city') return 'Ayala Malls Solenad Nuvali (Atrium)';
  if (id === 'building') return 'SM City Santa Rosa';
  return id.replace(/_/g, ' ');
};

export const getNodeLabelSafe = (
  id: any,
  nodes: ScenarioGraph['nodes'] | undefined
): string => {
  if (!id || typeof id !== 'string') return String(id || 'Unknown');
  if (!nodes) return id;
  const node = nodes.find(n => n.id === id);
  return node?.label || id;
};

export const safeReplace = (val: any): string => {
  if (!val || typeof val !== 'string') return String(val || 'N/A');
  return val.replace(/_/g, ' ').replace(/-/g, ' ');
};
