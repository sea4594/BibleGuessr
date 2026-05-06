'use client';

import { useEffect, useRef } from 'react';

interface Props {
  label: string;
  values: number[];
  selected: number;
  onChange: (value: number) => void;
  itemWidth?: number;
}

export default function HorizontalWheel({
  label,
  values,
  selected,
  onChange,
  itemWidth = 64,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx < 0 || !listRef.current) return;
    listRef.current.scrollLeft = idx * itemWidth;
  }, [selected, values, itemWidth]);

  const snapToNearest = () => {
    if (!listRef.current) return;
    const idx = Math.round(listRef.current.scrollLeft / itemWidth);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    listRef.current.scrollLeft = clamped * itemWidth;
    onChange(values[clamped]);
  };

  const onScroll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(snapToNearest, 110);
  };

  return (
    <div className="h-wheel-wrap">
      <span className="h-wheel-label">{label}</span>
      <div className="h-wheel-track" ref={listRef} onScroll={onScroll}>
        {values.map(value => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`h-wheel-item${value === selected ? ' selected' : ''}`}
            style={{ width: `${itemWidth}px`, minWidth: `${itemWidth}px` }}
          >
            {value}
          </button>
        ))}
      </div>
    </div>
  );
}
