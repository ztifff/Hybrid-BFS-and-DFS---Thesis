import type { HistoryEntry } from '../components/HistoryModal';

class HistoryDatabaseManager {
  private static instance: HistoryDatabaseManager;
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly DB_NAME = 'SimulationHistoryDB';
  private readonly STORE_NAME = 'historyStore';
  private readonly DB_VERSION = 1;

  private constructor() {
    // Private constructor prevents instantiation from outside
    console.log("HistoryDatabaseManager Singleton Initialized");
  }

  public static getInstance(): HistoryDatabaseManager {
    if (!HistoryDatabaseManager.instance) {
      HistoryDatabaseManager.instance = new HistoryDatabaseManager();
    }
    return HistoryDatabaseManager.instance;
  }

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
    return this.dbPromise;
  }

  public async get(key: string): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readonly');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  public async set(key: string, value: any): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE_NAME, 'readwrite');
      const store = tx.objectStore(this.STORE_NAME);
      const request = store.put(value, key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

export function getLocalHistoryKey(scenario: string): string {
  return `simulation_history_${scenario}`;
}

export function normalizeHistoryEntry(entry: any): HistoryEntry {
  return {
    ...entry,
    simResult: entry.simResult ?? entry.multiResults?.hybrid,
    timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
    metadata: entry.metadata,
  };
}

export function normalizeHistoryEntries(entries: any[]): HistoryEntry[] {
  return entries
    .filter((entry) => entry && (entry.simResult || entry.multiResults?.hybrid))
    .map(normalizeHistoryEntry);
}

export async function loadLocalHistory(scenario: string): Promise<HistoryEntry[]> {
  const dbManager = HistoryDatabaseManager.getInstance();
  const storedData = await dbManager.get(getLocalHistoryKey(scenario));
  if (!storedData) return [];
  
  let parsed = storedData;
  if (typeof storedData === 'string') {
    try { parsed = JSON.parse(storedData); } catch { return []; }
  }
  return Array.isArray(parsed) ? normalizeHistoryEntries(parsed) : [];
}

export async function persistLocalHistory(scenario: string, entries: HistoryEntry[]): Promise<void> {
  const dbManager = HistoryDatabaseManager.getInstance();
  await dbManager.set(getLocalHistoryKey(scenario), entries);
}