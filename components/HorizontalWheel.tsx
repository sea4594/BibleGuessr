'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

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
  const [sidePadding, setSidePadding] = useState(itemWidth);

  const getScrollLeftForIndex = useCallback((idx: number) => {
    return Math.max(0, idx * itemWidth);
  }, [itemWidth]);

  const getIndexForScrollLeft = useCallback((scrollLeft: number) => {
    return Math.round(scrollLeft / itemWidth);
  }, [itemWidth]);

  const scrollToIndex = useCallback((idx: number, smooth = true) => {
    if (!listRef.current) return;
    listRef.current.scrollTo({ left: getScrollLeftForIndex(idx), behavior: smooth ? 'smooth' : 'auto' });
  }, [getScrollLeftForIndex]);

  useEffect(() => {
    if (!listRef.current) return;

    const updatePadding = () => {
      if (!listRef.current) return;
      const nextPadding = Math.max(0, (listRef.current.clientWidth - itemWidth) / 2);
      setSidePadding(nextPadding);
    };

    updatePadding();
    const observer = new ResizeObserver(updatePadding);
    observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [itemWidth]);

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx < 0 || !listRef.current) return;
    scrollToIndex(idx);
  }, [selected, values, scrollToIndex]);

  const snapToNearest = () => {
    if (!listRef.current) return;
    const idx = getIndexForScrollLeft(listRef.current.scrollLeft);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    scrollToIndex(clamped);
    onChange(values[clamped]);
  };

  const onScroll = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(snapToNearest, 110);
  };

  return (
    <div className="h-wheel-wrap">
      <span className="h-wheel-label">{label}</span>
      <div className="h-wheel-viewport">
        <div className="h-wheel-track" ref={listRef} onScroll={onScroll}>
          <div className="h-wheel-spacer" style={{ width: `${sidePadding}px`, minWidth: `${sidePadding}px` }} aria-hidden="true" />
          {values.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => {
                const idx = values.indexOf(value);
                if (idx >= 0) {
                  scrollToIndex(idx);
                  onChange(value);
                }
              }}
              className={`h-wheel-item${value === selected ? ' selected' : ''}`}
              style={{ width: `${itemWidth}px`, minWidth: `${itemWidth}px` }}
            >
              {value}
            </button>
          ))}
          <div className="h-wheel-spacer" style={{ width: `${sidePadding}px`, minWidth: `${sidePadding}px` }} aria-hidden="true" />
        </div>
        <div className="h-wheel-center-box" style={{ width: `${itemWidth}px` }} aria-hidden="true" />
      </div>
    </div>
  );
}
