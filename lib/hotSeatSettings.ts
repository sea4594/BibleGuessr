import { bibleData } from './bibleData';
import { gameModes, type GameModeId } from './gameModes';
import {
  DEFAULT_TIMER_SECONDS,
  NO_TIMER_SECONDS,
  clampTimerSeconds,
} from './timerOptions';

export interface HotSeatSettings {
  players: number;
  names: string[];
  rounds: number;
  turnStyle: 'alternate' | 'all-at-once';
  timerSeconds: number;
  modeId: GameModeId;
  selectedBook: string;
  selectedBooks: string[];
}

const STORAGE_KEY = 'bg-hotseat-settings-v1';
const LEGACY_MODE_STORAGE_KEY = 'bg-hotseat-mode-v1';

export const defaultHotSeatSettings: HotSeatSettings = {
  players: 2,
  names: ['Player 1', 'Player 2'],
  rounds: 5,
  turnStyle: 'alternate',
  timerSeconds: DEFAULT_TIMER_SECONDS,
  modeId: 'full-bible',
  selectedBook: bibleData[0]?.book ?? 'Genesis',
  selectedBooks: bibleData.map(book => book.book),
};

function normalizeModeId(value: unknown): GameModeId {
  return typeof value === 'string' && value in gameModes
    ? value as GameModeId
    : defaultHotSeatSettings.modeId;
}

function normalizeBook(value: unknown): string {
  return typeof value === 'string' && bibleData.some(book => book.book === value)
    ? value
    : defaultHotSeatSettings.selectedBook;
}

function normalizeBooks(value: unknown): string[] {
  if (!Array.isArray(value)) return defaultHotSeatSettings.selectedBooks;
  const selected = new Set(value.filter((book): book is string => typeof book === 'string'));
  const ordered = bibleData.map(book => book.book).filter(book => selected.has(book));
  return ordered.length > 0 ? ordered : defaultHotSeatSettings.selectedBooks;
}

export function readHotSeatSettings(): HotSeatSettings {
  if (typeof window === 'undefined') return defaultHotSeatSettings;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as Partial<HotSeatSettings & { timerMinutes?: number }> : {};
    const players = Math.min(8, Math.max(2, parsed.players ?? defaultHotSeatSettings.players));
    const names = Array.isArray(parsed.names)
      ? parsed.names.slice(0, players).map((name, idx) => typeof name === 'string' ? name : `Player ${idx + 1}`)
      : defaultHotSeatSettings.names.slice(0, players);

    while (names.length < players) names.push(`Player ${names.length + 1}`);

    const migratedTimerSeconds = typeof parsed.timerSeconds === 'number'
      ? parsed.timerSeconds
      : typeof parsed.timerMinutes === 'number'
        ? parsed.timerMinutes * 60
        : defaultHotSeatSettings.timerSeconds;

    const legacyMode = localStorage.getItem(LEGACY_MODE_STORAGE_KEY);
    const modeId = normalizeModeId(parsed.modeId ?? legacyMode);

    return {
      players,
      names,
      rounds: Math.min(10, Math.max(1, parsed.rounds ?? defaultHotSeatSettings.rounds)),
      turnStyle: parsed.turnStyle === 'all-at-once' ? 'all-at-once' : 'alternate',
      timerSeconds: migratedTimerSeconds === NO_TIMER_SECONDS
        ? NO_TIMER_SECONDS
        : clampTimerSeconds(migratedTimerSeconds),
      modeId,
      selectedBook: normalizeBook(parsed.selectedBook),
      selectedBooks: normalizeBooks(parsed.selectedBooks),
    };
  } catch {
    return defaultHotSeatSettings;
  }
}

export function writeHotSeatSettings(settings: HotSeatSettings) {
  if (typeof window === 'undefined') return;
  const normalized: HotSeatSettings = {
    players: Math.min(8, Math.max(2, settings.players)),
    names: settings.names.slice(0, Math.min(8, Math.max(2, settings.players))),
    rounds: Math.min(10, Math.max(1, settings.rounds)),
    turnStyle: settings.turnStyle === 'all-at-once' ? 'all-at-once' : 'alternate',
    timerSeconds: settings.timerSeconds === NO_TIMER_SECONDS ? NO_TIMER_SECONDS : clampTimerSeconds(settings.timerSeconds),
    modeId: normalizeModeId(settings.modeId),
    selectedBook: normalizeBook(settings.selectedBook),
    selectedBooks: normalizeBooks(settings.selectedBooks),
  };
  while (normalized.names.length < normalized.players) normalized.names.push(`Player ${normalized.names.length + 1}`);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  localStorage.setItem(LEGACY_MODE_STORAGE_KEY, normalized.modeId);
}
