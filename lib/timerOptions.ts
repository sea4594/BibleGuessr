export const TIMER_SECOND_OPTIONS = Array.from({ length: 18 }, (_, idx) => (idx + 1) * 5);
export const QUICK_PLAY_TIMER_SECOND_OPTIONS = [...TIMER_SECOND_OPTIONS];
export const PARTY_TIMER_SECOND_OPTIONS = [...TIMER_SECOND_OPTIONS];

export const DEFAULT_TIMER_SECONDS = 60;

export function clampTimerSeconds(value: number): number {
  const normalized = Number.isFinite(value) ? Math.round(value / 5) * 5 : DEFAULT_TIMER_SECONDS;
  return Math.min(90, Math.max(5, normalized));
}

export function toTimerDurationSeconds(seconds: number): number {
  return clampTimerSeconds(seconds);
}
