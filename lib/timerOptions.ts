export const TIMER_MINUTE_OPTIONS = [1, 2, 3] as const;
export const TIMER_SECOND_OPTIONS = Array.from({ length: 61 }, (_, idx) => idx);

export const DEFAULT_TIMER_MINUTES = 1;
export const DEFAULT_TIMER_SECONDS = 0;

export function clampTimerMinutes(value: number): number {
  return Math.min(3, Math.max(1, Math.floor(value || DEFAULT_TIMER_MINUTES)));
}

export function clampTimerSeconds(value: number): number {
  return Math.min(60, Math.max(0, Math.floor(value || 0)));
}

export function toTimerDurationSeconds(minutes: number, seconds: number): number {
  return clampTimerMinutes(minutes) * 60 + clampTimerSeconds(seconds);
}
