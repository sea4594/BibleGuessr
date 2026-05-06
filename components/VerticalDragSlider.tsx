'use client';
import { useCallback, useRef, useState } from 'react';

interface Props {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  label: string;
  disabled?: boolean;
}

// Upward calibration: fingertip registers at center of touch, but the visible
// tip is this many px higher. Adjust so the selected item matches where the
// user actually points.
const CALIBRATION_OFFSET = 22;
const POPUP_H = 130; // approximate popup height, px

export default function VerticalDragSlider({
  items,
  selectedIndex,
  onChange,
  label,
  disabled = false,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(selectedIndex);
  const [rawPx, setRawPx] = useState(0); // calibrated px from top of track

  const compute = useCallback((clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return { idx: 0, px: 0 };
    const adjusted = clientY - CALIBRATION_OFFSET;
    const px = Math.min(rect.height, Math.max(0, adjusted - rect.top));
    const frac = rect.height > 0 ? px / rect.height : 0;
    const idx = Math.round(frac * (items.length - 1));
    return { idx, px };
  }, [items.length]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { idx, px } = compute(e.clientY);
    setHoverIdx(idx);
    setRawPx(px);
    setDragging(true);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled) return;
    const { idx, px } = compute(e.clientY);
    setHoverIdx(idx);
    setRawPx(px);
  };

  const onUp = () => {
    if (dragging) onChange(hoverIdx);
    setDragging(false);
  };

  const activeIdx = dragging ? hoverIdx : selectedIndex;
  const thumbPct = items.length <= 1 ? 0 : (activeIdx / (items.length - 1)) * 100;

  // 5-item context window
  const contextItems = [-2, -1, 0, 1, 2].map(off => {
    const i = hoverIdx + off;
    return i < 0 || i >= items.length ? null : { label: items[i], isCenter: off === 0 };
  });

  // Popup top: position so popup bottom sits just above the calibrated touch point
  const popupTopPx = Math.max(2, rawPx - POPUP_H - 10);

  return (
    <div className={`vslider-col${disabled ? ' opacity-40' : ''}`}>
      <p className="vslider-label">{label}</p>
      <p className="vslider-selected-val">{disabled ? '—' : items[activeIdx] ?? '—'}</p>

      <div className="vslider-track-wrap">
        <div
          ref={trackRef}
          className="vslider-track"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          style={{ touchAction: 'none', cursor: disabled ? 'default' : 'pointer' }}
        >
          <div className="vslider-book-list" aria-hidden="true">
            {items.map((name, i) => (
              <div key={i} className={`vslider-book-item${i === activeIdx ? ' active' : ''}`}>
                {name}
              </div>
            ))}
          </div>

          <div className="vslider-thumb-line" style={{ top: `${thumbPct}%` }} aria-hidden="true" />
        </div>

        {dragging && (
          <div className="vslider-popup vslider-popup-above" style={{ top: `${popupTopPx}px` }}>
            {contextItems.map((item, i) =>
              item === null ? (
                <div key={i} className="vslider-popup-item empty" />
              ) : (
                <div key={i} className={`vslider-popup-item${item.isCenter ? ' center' : ''}`}>
                  {item.label}
                </div>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
