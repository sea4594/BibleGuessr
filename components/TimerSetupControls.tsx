import { TIMER_MINUTE_OPTIONS, TIMER_SECOND_OPTIONS } from '@/lib/timerOptions';

interface Props {
  minutes: number;
  seconds: number;
  onMinutesChange: (value: number) => void;
  onSecondsChange: (value: number) => void;
  embedded?: boolean;
}

export default function TimerSetupControls({
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
  embedded = false,
}: Props) {
  const controls = (
    <>
      <div className="timer-inline-row">
        <p className="text-sm font-semibold">Timer</p>
        <div className="timer-inline-controls">
          <label className="timer-inline-label">
          <select
            value={minutes}
            onChange={e => onMinutesChange(Number(e.target.value))}
              className="settings-input timer-inline-select"
          >
            {TIMER_MINUTE_OPTIONS.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
            <span>Minutes</span>
          </label>

          <label className="timer-inline-label">
          <select
            value={seconds}
            onChange={e => onSecondsChange(Number(e.target.value))}
              className="settings-input timer-inline-select"
          >
            {TIMER_SECOND_OPTIONS.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
            <span>Seconds</span>
          </label>
        </div>
      </div>
      </>
  );

  if (embedded) {
    return controls;
  }

  return <section className="surface-card p-2.5 sm:p-3">{controls}</section>;
}
