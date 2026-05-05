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
    <div className={disabled ? 'opacity-50' : ''}>
      <div className="flex justify-between items-center mb-1">
        <label className="text-slate-300 text-sm font-medium">{label}</label>
        <span className="text-amber-400 font-bold text-lg min-w-8 text-right">
          {disabled ? '-' : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={disabled ? min : value}
        disabled={disabled}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-full accent-amber-400"
      />
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
