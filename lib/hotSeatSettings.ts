export interface HotSeatSettings {
  players: number;
  names: string[];
  rounds: number;
  turnStyle: 'alternate' | 'all-at-once';
}

const STORAGE_KEY = 'bg-hotseat-settings-v1';

export const defaultHotSeatSettings: HotSeatSettings = {
  players: 2,
  names: ['Player 1', 'Player 2'],
  rounds: 5,
  turnStyle: 'alternate',
};

export function readHotSeatSettings(): HotSeatSettings {
  if (typeof window === 'undefined') return defaultHotSeatSettings;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultHotSeatSettings;
    const parsed = JSON.parse(raw) as Partial<HotSeatSettings>;
    const players = Math.min(8, Math.max(2, parsed.players ?? defaultHotSeatSettings.players));
    const names = parsed.names?.slice(0, players) ?? defaultHotSeatSettings.names.slice(0, players);

    while (names.length < players) {
      names.push(`Player ${names.length + 1}`);
    }

    return {
      players,
      names,
      rounds: Math.min(10, Math.max(1, parsed.rounds ?? defaultHotSeatSettings.rounds)),
      turnStyle: parsed.turnStyle ?? defaultHotSeatSettings.turnStyle,
    };
  } catch {
    return defaultHotSeatSettings;
  }
}

export function writeHotSeatSettings(settings: HotSeatSettings) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}