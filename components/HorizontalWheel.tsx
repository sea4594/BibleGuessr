'use client';

import { useCallback, useEffect, useRef } from 'react';

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
  const spacerWidth = itemWidth;

  const getScrollLeftForIndex = useCallback((idx: number) => {
    if (!listRef.current) return 0;
    const centerX = spacerWidth + idx * itemWidth + itemWidth / 2;
    return Math.max(0, centerX - listRef.current.clientWidth / 2);
  }, [itemWidth, spacerWidth]);

  const getIndexForScrollLeft = useCallback((scrollLeft: number) => {
    if (!listRef.current) return 0;
    const centerX = scrollLeft + listRef.current.clientWidth / 2;
    return Math.round((centerX - spacerWidth - itemWidth / 2) / itemWidth);
  }, [itemWidth, spacerWidth]);

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx < 0 || !listRef.current) return;
    listRef.current.scrollTo({ left: getScrollLeftForIndex(idx), behavior: 'smooth' });
  }, [selected, values, getScrollLeftForIndex]);

  const snapToNearest = () => {
    if (!listRef.current) return;
    const idx = getIndexForScrollLeft(listRef.current.scrollLeft);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    listRef.current.scrollTo({ left: getScrollLeftForIndex(clamped), behavior: 'smooth' });
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
        <div className="h-wheel-spacer" style={{ width: `${spacerWidth}px`, minWidth: `${spacerWidth}px` }} aria-hidden="true" />
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
        <div className="h-wheel-spacer" style={{ width: `${spacerWidth}px`, minWidth: `${spacerWidth}px` }} aria-hidden="true" />
        <div className="h-wheel-center-box" style={{ width: `${itemWidth}px` }} aria-hidden="true" />
      </div>
    </div>
  );
}
