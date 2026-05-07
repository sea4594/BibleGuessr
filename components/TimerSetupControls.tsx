interface Props {
  minutes: number;
  seconds: number;
  onMinutesChange: (value: number) => void;
  onSecondsChange: (value: number) => void;
}

const minuteOptions = [1, 2, 3];
const secondOptions = Array.from({ length: 61 }, (_, idx) => idx);

export default function TimerSetupControls({
  minutes,
  seconds,
  onMinutesChange,
  onSecondsChange,
}: Props) {
  return (
    <section className="surface-card p-2.5 sm:p-3">
      <div className="timer-inline-row">
        <p className="text-sm font-semibold">Timer</p>
        <div className="timer-inline-controls">
          <label className="timer-inline-label">
          <select
            value={minutes}
            onChange={e => onMinutesChange(Number(e.target.value))}
              className="settings-input timer-inline-select"
          >
            {minuteOptions.map(value => (
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
            {secondOptions.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
            <span>Seconds</span>
          </label>
        </div>
      </div>
    </section>
  );
}
