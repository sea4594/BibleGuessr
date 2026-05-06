'use client';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (val: number) => void;
}

export default function ChapterVerseSlider({ label, value, min, max, disabled, onChange }: Props) {
  const clamp = (next: number) => Math.min(Math.max(next, min), max);

  return (
    <div className={`guess-column ${disabled ? 'opacity-45' : ''}`}>
      <p className="guess-label">{label}</p>
      <p className="guess-value">{disabled ? '-' : value}</p>
      <p className="slider-meta">{disabled ? '-' : `${value} / ${max}`}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={disabled ? min : value}
        disabled={disabled}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="vertical-range"
        aria-label={label}
      />

      <div className="slider-step-controls">
        <button
          type="button"
          onClick={() => onChange(clamp(value - 1))}
          disabled={disabled || value <= min}
          className="slider-step-btn"
          aria-label={`${label} down`}
        >
          -
        </button>
        <button
          type="button"
          onClick={() => onChange(clamp(value + 1))}
          disabled={disabled || value >= max}
          className="slider-step-btn"
          aria-label={`${label} up`}
        >
          +
        </button>
      </div>

      <div className="guess-minmax">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
