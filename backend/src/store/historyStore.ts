import path from 'path';
import fs from 'fs';
import initSqlJs, { Database } from 'sql.js';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'simulation.db');

if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database;

function getDb(): Database {
  return db;
}

async function initDb(): Promise<void> {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS simulation_results (
      id TEXT PRIMARY KEY,
      run_number INTEGER,
      name TEXT,
      algorithm TEXT,
      scenario TEXT,
      graph_size TEXT DEFAULT 'medium',
      map_mode TEXT DEFAULT 'synthetic',
      seed INTEGER,
      timestamp TEXT,
      bfs_time_elapsed REAL,
      bfs_nodes_explored INTEGER,
      bfs_path_length INTEGER,
      bfs_total_latency REAL,
      bfs_memory_used REAL,
      bfs_completion_rate REAL,
      bfs_adaptability_score REAL,
      bfs_exit_found INTEGER,
      dfs_time_elapsed REAL,
      dfs_nodes_explored INTEGER,
      dfs_path_length INTEGER,
      dfs_total_latency REAL,
      dfs_memory_used REAL,
      dfs_completion_rate REAL,
      dfs_adaptability_score REAL,
      dfs_exit_found INTEGER,
      hybrid_time_elapsed REAL,
      hybrid_nodes_explored INTEGER,
      hybrid_path_length INTEGER,
      hybrid_total_latency REAL,
      hybrid_memory_used REAL,
      hybrid_completion_rate REAL,
      hybrid_adaptability_score REAL,
      hybrid_exit_found INTEGER,
      optimal_path_length INTEGER,
      total_nodes INTEGER,
      dynamic_event_count INTEGER,
      full_result_json TEXT
    )
  `);

  saveDb();
}

function saveDb(): void {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function computeAdaptabilityScore(
  metrics: any,
  algorithm: string,
  dynamicEventCount: number
): number {
  // NOTE: Canonical formula mirrors frontend/src/utils/metricsHelpers.ts (keep synchronized)
  if (!metrics) return 0;
  let score = metrics.exitFound ? 50 : 0;

  if (dynamicEventCount > 0) {
    const eventBonus = Math.min(40, dynamicEventCount * 10);
    score += metrics.exitFound ? eventBonus : Math.floor(eventBonus / 3);

    if (algorithm === 'hybrid' && metrics.exitFound) score += 10;
    else if (algorithm === 'bfs' && metrics.exitFound) score += 5;
  } else {
    score += metrics.exitFound ? 35 : 0;
  }

  if (metrics.exitFound && metrics.pathLength > 0) {
    score += Math.min(10, Math.max(0, Math.floor((50 - metrics.pathLength) / 5)));
  }

  return Math.min(100, Math.max(0, score));
}

export interface HistoryEntry {
  id: string;
  runNumber: number;
  name: string;
  algorithm: string;
  scenario: string;
  graphSize?: string;
  mapMode?: string;
  seed?: number;
  simResult: any;
  multiResults?: { bfs: any; dfs: any; hybrid: any };
  optimalPathLength: number;
  totalNodes: number;
  timestamp: Date;
}

function rowToEntry(row: any[], columns: string[]): HistoryEntry {
  const col = (name: string) => {
    const idx = columns.indexOf(name);
    return idx >= 0 ? row[idx] : undefined;
  };

  let parsed: any = {};
  try { parsed = JSON.parse(col('full_result_json') || '{}'); } catch {}

  return {
    id: col('id'),
    runNumber: col('run_number'),
    name: col('name'),
    algorithm: col('algorithm'),
    scenario: col('scenario'),
    graphSize: col('graph_size'),
    mapMode: col('map_mode'),
    seed: col('seed'),
    simResult: parsed.simResult ?? null,
    multiResults: parsed.multiResults ?? null,
    optimalPathLength: col('optimal_path_length'),
    totalNodes: col('total_nodes'),
    timestamp: new Date(col('timestamp')),
  };
}

export const simulationHistory = {
  set(id: string, entry: HistoryEntry): void {
    const mr = entry.multiResults;
    const dynamicEventCount = mr?.hybrid?.dynamicEvents?.length ?? 0;
    const bfs = mr?.bfs?.metrics;
    const dfs = mr?.dfs?.metrics;
    const hybrid = mr?.hybrid?.metrics;

    getDb().run(`
      INSERT OR REPLACE INTO simulation_results VALUES (
        ?,?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,
        ?,?,?,?,?,?,?,?,
        ?,?,?,?
      )
    `, [
      id, entry.runNumber, entry.name, entry.algorithm, entry.scenario,
      entry.graphSize ?? 'medium', entry.mapMode ?? 'synthetic',
      entry.seed ?? 0, new Date(entry.timestamp).toISOString(),

      bfs?.timeElapsed ?? 0, bfs?.nodesExplored ?? 0, bfs?.pathLength ?? 0,
      bfs?.totalLatency ?? 0, bfs?.memoryUsed ?? 0, bfs?.completionRate ?? 0,
      computeAdaptabilityScore(bfs, 'bfs', dynamicEventCount), bfs?.exitFound ? 1 : 0,

      dfs?.timeElapsed ?? 0, dfs?.nodesExplored ?? 0, dfs?.pathLength ?? 0,
      dfs?.totalLatency ?? 0, dfs?.memoryUsed ?? 0, dfs?.completionRate ?? 0,
      computeAdaptabilityScore(dfs, 'dfs', dynamicEventCount), dfs?.exitFound ? 1 : 0,

      hybrid?.timeElapsed ?? 0, hybrid?.nodesExplored ?? 0, hybrid?.pathLength ?? 0,
      hybrid?.totalLatency ?? 0, hybrid?.memoryUsed ?? 0, hybrid?.completionRate ?? 0,
      computeAdaptabilityScore(hybrid, 'hybrid', dynamicEventCount), hybrid?.exitFound ? 1 : 0,

      entry.optimalPathLength, entry.totalNodes, dynamicEventCount,
      JSON.stringify({ simResult: entry.simResult, multiResults: entry.multiResults }),
    ]);

    saveDb();
  },

  get(id: string): HistoryEntry | undefined {
    const result = getDb().exec(
      'SELECT * FROM simulation_results WHERE id = ?', [id]
    );
    if (!result.length || !result[0].values.length) return undefined;
    return rowToEntry(result[0].values[0], result[0].columns);
  },

  delete(id: string): boolean {
    getDb().run('DELETE FROM simulation_results WHERE id = ?', [id]);
    saveDb();
    return true;
  },

  getAll(): HistoryEntry[] {
    const result = getDb().exec(
      'SELECT * FROM simulation_results ORDER BY timestamp DESC'
    );
    if (!result.length) return [];
    return result[0].values.map(row => rowToEntry(row, result[0].columns));
  },

  getPaginated(page: number, limit: number): { data: HistoryEntry[]; total: number } {
    const offset = (page - 1) * limit;
    const result = getDb().exec(
      'SELECT * FROM simulation_results ORDER BY timestamp DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const countResult = getDb().exec('SELECT COUNT(*) FROM simulation_results');
    const total = countResult[0]?.values[0]?.[0] as number ?? 0;
    const data = result.length ? result[0].values.map(row => rowToEntry(row, result[0].columns)) : [];
    return { data, total };
  },

  exportCSV(scenario?: string, graphSize?: string): string {
    let query = 'SELECT * FROM simulation_results';
    const params: any[] = [];
    const conditions: string[] = [];
    if (scenario) { conditions.push('scenario = ?'); params.push(scenario); }
    if (graphSize) { conditions.push('graph_size = ?'); params.push(graphSize); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY timestamp DESC';

    const result = getDb().exec(query, params);
    if (!result.length) return '';

    const columns = result[0].columns.filter(c => c !== 'full_result_json');
    const colIndexes = columns.map(c => result[0].columns.indexOf(c));

    const rows = result[0].values.map(row =>
      colIndexes.map(i => {
        const val = row[i];
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
      }).join(',')
    );

    return [columns.join(','), ...rows].join('\n');
  },
};

export { initDb };