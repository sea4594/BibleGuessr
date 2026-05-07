import { setSyncedLocalStorageItem } from './localDataState';

export interface GameRecord {
  timestamp: number;
  modeId: string;
  modeName: string;
  totalScore: number;
  accuracy: number;
  rounds: number;
}

export interface GameStatsSummary {
  gamesPlayed: number;
  bestScore: number;
  averageAccuracy: number;
  bestAccuracy: number;
  latest?: GameRecord;
}

const STORAGE_KEY = 'bg-game-history-v1';

export function readGameHistory(): GameRecord[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GameRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeGameHistory(history: GameRecord[]) {
  if (typeof window === 'undefined') {
    return;
  }
  setSyncedLocalStorageItem(STORAGE_KEY, JSON.stringify(history));
}

export function addGameRecord(record: GameRecord) {
  const history = readGameHistory();
  const next = [record, ...history].slice(0, 60);
  writeGameHistory(next);
}

export function summarizeGameHistory(history: GameRecord[]): GameStatsSummary {
  if (history.length === 0) {
    return {
      gamesPlayed: 0,
      bestScore: 0,
      averageAccuracy: 0,
      bestAccuracy: 0,
    };
  }

  const totalAccuracy = history.reduce((sum, g) => sum + g.accuracy, 0);
  return {
    gamesPlayed: history.length,
    bestScore: Math.max(...history.map(g => g.totalScore)),
    averageAccuracy: Math.round(totalAccuracy / history.length),
    bestAccuracy: Math.max(...history.map(g => g.accuracy)),
    latest: history[0],
  };
}
