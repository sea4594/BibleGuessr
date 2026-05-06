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
  return (
    <div className={`guess-column ${disabled ? 'opacity-45' : ''}`}>
      <p className="guess-label">{label}</p>
      <p className="guess-value">{disabled ? '-' : value}</p>
      <input
        type="range"
        min={min}
        max={max}
        value={disabled ? min : value}
        disabled={disabled}
        onChange={e => onChange(parseInt(e.target.value, 10))}
        className="vertical-range"
        aria-label={label}
      />
      <div className="guess-minmax">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
