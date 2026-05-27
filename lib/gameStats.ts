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

export interface ModeStatsRecord {
  modeId: string;
  modeName: string;
  gamesPlayed: number;
  averageScore: number;
  averageAccuracy: number;
  bestScore: number;
  bestAccuracy: number;
  lastPlayedAt: number;
}

const STORAGE_KEY = 'bg-game-history-v1';
const MODE_STATS_STORAGE_KEY = 'bg-game-mode-stats-v1';

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? value : 0));
}

function resolveRecordScorePercent(record: GameRecord): number {
  if (record.totalScore <= 100) return clampPercent(record.totalScore);
  const rounds = Math.max(1, record.rounds || 1);
  return clampPercent((record.totalScore / (rounds * 100)) * 100);
}

function normalizeModeStats(raw: unknown): Record<string, ModeStatsRecord> {
  if (!raw || typeof raw !== 'object') return {};

  const parsed = raw as Record<string, Partial<ModeStatsRecord>>;
  const next: Record<string, ModeStatsRecord> = {};

  for (const [modeId, value] of Object.entries(parsed)) {
    if (!value || typeof value !== 'object') continue;

    const gamesPlayed = Number.isFinite(value.gamesPlayed) ? Math.max(0, Math.round(value.gamesPlayed ?? 0)) : 0;
    if (gamesPlayed <= 0) continue;

    next[modeId] = {
      modeId,
      modeName: typeof value.modeName === 'string' && value.modeName.trim() ? value.modeName : modeId,
      gamesPlayed,
      averageScore: Number.isFinite(value.averageScore) ? Number(value.averageScore) : 0,
      averageAccuracy: Number.isFinite(value.averageAccuracy) ? Number(value.averageAccuracy) : 0,
      bestScore: Number.isFinite(value.bestScore) ? Number(value.bestScore) : 0,
      bestAccuracy: Number.isFinite(value.bestAccuracy) ? Number(value.bestAccuracy) : 0,
      lastPlayedAt: Number.isFinite(value.lastPlayedAt) ? Number(value.lastPlayedAt) : 0,
    };
  }

  return next;
}

export function readModeStats(): ModeStatsRecord[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(MODE_STATS_STORAGE_KEY);
    if (!raw) {
      const migrated = buildModeStatsFromHistory(readGameHistory());
      if (Object.keys(migrated).length > 0) {
        writeModeStats(migrated);
      }
      return Object.values(migrated).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    }

    const normalized = normalizeModeStats(JSON.parse(raw));
    if (Object.keys(normalized).length === 0) {
      const migrated = buildModeStatsFromHistory(readGameHistory());
      if (Object.keys(migrated).length > 0) {
        writeModeStats(migrated);
      }
      return Object.values(migrated).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
    }
    return Object.values(normalized).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
  } catch {
    return Object.values(buildModeStatsFromHistory(readGameHistory())).sort((a, b) => b.lastPlayedAt - a.lastPlayedAt);
  }
}

function writeModeStats(stats: Record<string, ModeStatsRecord>) {
  if (typeof window === 'undefined') return;
  setSyncedLocalStorageItem(MODE_STATS_STORAGE_KEY, JSON.stringify(stats));
}

function updateModeStatsWithRecord(record: GameRecord) {
  if (typeof window === 'undefined') return;

  const scorePercent = resolveRecordScorePercent(record);
  const accuracyPercent = clampPercent(record.accuracy);

  let existing: Record<string, ModeStatsRecord> = {};
  try {
    existing = normalizeModeStats(JSON.parse(localStorage.getItem(MODE_STATS_STORAGE_KEY) ?? '{}'));
  } catch {
    existing = {};
  }

  const previous = existing[record.modeId];
  if (!previous) {
    existing[record.modeId] = {
      modeId: record.modeId,
      modeName: record.modeName,
      gamesPlayed: 1,
      averageScore: scorePercent,
      averageAccuracy: accuracyPercent,
      bestScore: scorePercent,
      bestAccuracy: accuracyPercent,
      lastPlayedAt: record.timestamp,
    };
    writeModeStats(existing);
    return;
  }

  const nextGamesPlayed = previous.gamesPlayed + 1;
  existing[record.modeId] = {
    modeId: record.modeId,
    modeName: record.modeName,
    gamesPlayed: nextGamesPlayed,
    averageScore: ((previous.averageScore * previous.gamesPlayed) + scorePercent) / nextGamesPlayed,
    averageAccuracy: ((previous.averageAccuracy * previous.gamesPlayed) + accuracyPercent) / nextGamesPlayed,
    bestScore: Math.max(previous.bestScore, scorePercent),
    bestAccuracy: Math.max(previous.bestAccuracy, accuracyPercent),
    lastPlayedAt: record.timestamp,
  };

  writeModeStats(existing);
}

function buildModeStatsFromHistory(history: GameRecord[]): Record<string, ModeStatsRecord> {
  const stats: Record<string, ModeStatsRecord> = {};

  for (const record of history) {
    const scorePercent = resolveRecordScorePercent(record);
    const accuracyPercent = clampPercent(record.accuracy);
    const existing = stats[record.modeId];
    if (!existing) {
      stats[record.modeId] = {
        modeId: record.modeId,
        modeName: record.modeName,
        gamesPlayed: 1,
        averageScore: scorePercent,
        averageAccuracy: accuracyPercent,
        bestScore: scorePercent,
        bestAccuracy: accuracyPercent,
        lastPlayedAt: record.timestamp,
      };
      continue;
    }

    const nextGamesPlayed = existing.gamesPlayed + 1;
    stats[record.modeId] = {
      ...existing,
      modeName: record.modeName,
      gamesPlayed: nextGamesPlayed,
      averageScore: ((existing.averageScore * existing.gamesPlayed) + scorePercent) / nextGamesPlayed,
      averageAccuracy: ((existing.averageAccuracy * existing.gamesPlayed) + accuracyPercent) / nextGamesPlayed,
      bestScore: Math.max(existing.bestScore, scorePercent),
      bestAccuracy: Math.max(existing.bestAccuracy, accuracyPercent),
      lastPlayedAt: Math.max(existing.lastPlayedAt, record.timestamp),
    };
  }

  return stats;
}

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
  updateModeStatsWithRecord(record);
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
