'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  label: string;
  values: number[];
  selected: number;
  onChange: (value: number) => void;
  itemWidth?: number;
  formatValue?: (value: number) => string;
}

export default function HorizontalWheel({
  label,
  values,
  selected,
  onChange,
  itemWidth = 64,
  formatValue = value => String(value),
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const programmaticScrollRef = useRef(false);
  const programmaticReleaseRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sidePadding, setSidePadding] = useState(itemWidth);

  const getScrollLeftForIndex = useCallback((idx: number) => Math.max(0, idx * itemWidth), [itemWidth]);
  const getIndexForScrollLeft = useCallback((scrollLeft: number) => Math.round(scrollLeft / itemWidth), [itemWidth]);

  const alignToIndex = useCallback((idx: number) => {
    if (!listRef.current) return;
    programmaticScrollRef.current = true;
    if (programmaticReleaseRef.current) clearTimeout(programmaticReleaseRef.current);
    listRef.current.scrollTo({ left: getScrollLeftForIndex(idx), behavior: 'auto' });
    programmaticReleaseRef.current = setTimeout(() => {
      programmaticScrollRef.current = false;
      programmaticReleaseRef.current = null;
    }, 120);
  }, [getScrollLeftForIndex]);

  useEffect(() => {
    if (!viewportRef.current) return;
    const updatePadding = () => {
      if (!viewportRef.current) return;
      const nextPadding = Math.max(0, Math.round((viewportRef.current.clientWidth - itemWidth) / 2));
      setSidePadding(prev => (prev === nextPadding ? prev : nextPadding));
    };
    updatePadding();
    const observer = new ResizeObserver(updatePadding);
    observer.observe(viewportRef.current);
    return () => observer.disconnect();
  }, [itemWidth]);

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0) alignToIndex(idx);
  }, [alignToIndex, selected, sidePadding, values]);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (programmaticReleaseRef.current) clearTimeout(programmaticReleaseRef.current);
  }, []);

  const snapToNearest = () => {
    if (!listRef.current || programmaticScrollRef.current) return;
    const idx = getIndexForScrollLeft(listRef.current.scrollLeft);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    const value = values[clamped];
    alignToIndex(clamped);
    if (value !== selected) onChange(value);
  };

  const onScroll = () => {
    if (programmaticScrollRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(snapToNearest, 110);
  };

  return (
    <div className="h-wheel-wrap">
      <span className="h-wheel-label">{label}</span>
      <div className="h-wheel-viewport" ref={viewportRef}>
        <div className="h-wheel-track" ref={listRef} onScroll={onScroll}>
          <div className="h-wheel-spacer" style={{ width: `${sidePadding}px`, minWidth: `${sidePadding}px` }} aria-hidden="true" />
          {values.map(value => (
            <button
              key={value}
              type="button"
              onClick={() => {
                const idx = values.indexOf(value);
                if (idx >= 0) alignToIndex(idx);
                if (value !== selected) onChange(value);
              }}
              className={`h-wheel-item${value === selected ? ' selected' : ''}`}
              style={{ width: `${itemWidth}px`, minWidth: `${itemWidth}px` }}
            >
              {formatValue(value)}
            </button>
          ))}
          <div className="h-wheel-spacer" style={{ width: `${sidePadding}px`, minWidth: `${sidePadding}px` }} aria-hidden="true" />
        </div>
        <div className="h-wheel-center-box" style={{ width: `${itemWidth}px` }} aria-hidden="true" />
      </div>
    </div>
  );
}
