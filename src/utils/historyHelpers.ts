import type { HistoryEntry } from '../components/HistoryModal';

export function getLocalHistoryKey(scenario: string): string {
  return `simulation_history_${scenario}`;
}

export function normalizeHistoryEntry(entry: any): HistoryEntry {
  return {
    ...entry,
    simResult: entry.simResult ?? entry.multiResults?.hybrid,
    timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
  };
}

export function normalizeHistoryEntries(entries: any[]): HistoryEntry[] {
  return entries
    .filter((entry) => entry && (entry.simResult || entry.multiResults?.hybrid))
    .map(normalizeHistoryEntry);
}

export function loadLocalHistory(scenario: string): HistoryEntry[] {
  const storedData = localStorage.getItem(getLocalHistoryKey(scenario));
  if (!storedData) return [];
  const parsed = JSON.parse(storedData);
  return Array.isArray(parsed) ? normalizeHistoryEntries(parsed) : [];
}

export function persistLocalHistory(scenario: string, entries: HistoryEntry[]): void {
  localStorage.setItem(getLocalHistoryKey(scenario), JSON.stringify(entries));
}