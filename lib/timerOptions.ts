export const TIMER_MINUTE_OPTIONS = [0, 1, 2, 3] as const;
export const TIMER_SECOND_OPTIONS = Array.from({ length: 12 }, (_, idx) => idx * 5);
export const QUICK_PLAY_TIMER_SECOND_OPTIONS = Array.from({ length: 18 }, (_, idx) => (idx + 1) * 5);

export const DEFAULT_TIMER_MINUTES = 1;
export const DEFAULT_TIMER_SECONDS = 0;

export function clampTimerMinutes(value: number): number {
  const normalized = Number.isFinite(value) ? Math.floor(value) : DEFAULT_TIMER_MINUTES;
  return Math.min(3, Math.max(0, normalized));
}

export function clampTimerSeconds(value: number): number {
  const normalized = Number.isFinite(value) ? Math.round(value / 5) * 5 : DEFAULT_TIMER_SECONDS;
  return Math.min(55, Math.max(0, normalized));
}

export function toTimerDurationSeconds(minutes: number, seconds: number): number {
  return clampTimerMinutes(minutes) * 60 + clampTimerSeconds(seconds);
}
