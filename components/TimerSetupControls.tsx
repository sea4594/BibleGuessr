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
    <section className="surface-card p-4 sm:p-5">
      <p className="text-sm font-semibold mb-3">Round Timer</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-1.5 text-sm font-semibold">
          <span>Minutes</span>
          <select
            value={minutes}
            onChange={e => onMinutesChange(Number(e.target.value))}
            className="settings-input !w-full"
          >
            {minuteOptions.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>

        <label className="grid gap-1.5 text-sm font-semibold">
          <span>Seconds</span>
          <select
            value={seconds}
            onChange={e => onSecondsChange(Number(e.target.value))}
            className="settings-input !w-full"
          >
            {secondOptions.map(value => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="text-xs content-muted mt-2">The timer counts down every round and auto-submits when it reaches 0.</p>
    </section>
  );
}
