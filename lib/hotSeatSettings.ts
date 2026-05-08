import {
  DEFAULT_TIMER_SECONDS,
  clampTimerSeconds,
} from './timerOptions';
import { setSyncedLocalStorageItem } from './localDataState';

export interface HotSeatSettings {
  players: number;
  names: string[];
  rounds: number;
  turnStyle: 'alternate' | 'all-at-once';
  timerSeconds: number;
}

const STORAGE_KEY = 'bg-hotseat-settings-v1';

export const defaultHotSeatSettings: HotSeatSettings = {
  players: 2,
  names: ['Player 1', 'Player 2'],
  rounds: 5,
  turnStyle: 'alternate',
  timerSeconds: DEFAULT_TIMER_SECONDS,
};

export function readHotSeatSettings(): HotSeatSettings {
  if (typeof window === 'undefined') return defaultHotSeatSettings;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultHotSeatSettings;
    const parsed = JSON.parse(raw) as Partial<HotSeatSettings & { timerMinutes?: number }>;
    const players = Math.min(8, Math.max(2, parsed.players ?? defaultHotSeatSettings.players));
    const names = parsed.names?.slice(0, players) ?? defaultHotSeatSettings.names.slice(0, players);

    while (names.length < players) {
      names.push(`Player ${names.length + 1}`);
    }

    const migratedTimerSeconds =
      typeof parsed.timerSeconds === 'number'
        ? parsed.timerSeconds
        : (typeof parsed.timerMinutes === 'number' ? parsed.timerMinutes * 60 : defaultHotSeatSettings.timerSeconds);

    return {
      players,
      names,
      rounds: Math.min(10, Math.max(1, parsed.rounds ?? defaultHotSeatSettings.rounds)),
      turnStyle: parsed.turnStyle ?? defaultHotSeatSettings.turnStyle,
      timerSeconds: clampTimerSeconds(migratedTimerSeconds),
    };
  } catch {
    return defaultHotSeatSettings;
  }
}

export function writeHotSeatSettings(settings: HotSeatSettings) {
  if (typeof window === 'undefined') return;
  setSyncedLocalStorageItem(STORAGE_KEY, JSON.stringify(settings));
}