'use client';
import { useCallback, useRef, useState } from 'react';

interface Props {
  items: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  label: string;
  disabled?: boolean;
  /**
   * If true, the track renders each item as a tiny text label (book mode).
   * If false, renders a gradient fill with no individual labels.
   */
  listMode?: boolean;
}

export default function VerticalDragSlider({
  items,
  selectedIndex,
  onChange,
  label,
  disabled = false,
  listMode = false,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(selectedIndex);
  const [popupTop, setPopupTop] = useState(0); // fraction 0-1

  const idxFromEvent = useCallback((clientY: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    const frac = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return Math.round(frac * (items.length - 1));
  }, [items.length]);

  const fracFromEvent = useCallback((clientY: number): number => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const idx = idxFromEvent(e.clientY);
    const frac = fracFromEvent(e.clientY);
    setHoverIdx(idx);
    setPopupTop(frac);
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || disabled) return;
    const idx = idxFromEvent(e.clientY);
    const frac = fracFromEvent(e.clientY);
    setHoverIdx(idx);
    setPopupTop(frac);
  };

  const handlePointerUp = () => {
    if (dragging) {
      onChange(hoverIdx);
    }
    setDragging(false);
  };

  const fillPercent = items.length <= 1 ? 100 : (selectedIndex / (items.length - 1)) * 100;
  const activeIdx = dragging ? hoverIdx : selectedIndex;

  // Popup context: show 5 items centered on hoverIdx
  const contextItems = [-2, -1, 0, 1, 2].map(off => {
    const i = hoverIdx + off;
    if (i < 0 || i >= items.length) return null;
    return { label: items[i], isCenter: off === 0 };
  });

  // Clamp popup so it stays visible
  const popupY = Math.min(Math.max(popupTop * 100, 8), 92);

  return (
    <div className={`vslider-col${disabled ? ' opacity-40' : ''}`}>
      {/* Column header */}
      <p className="vslider-label">{label}</p>
      <p className="vslider-selected-val">{disabled ? '—' : items[activeIdx] ?? '—'}</p>

      {/* Track */}
      <div className="vslider-track-wrap">
        <div
          ref={trackRef}
          className="vslider-track"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none', cursor: disabled ? 'default' : 'pointer' }}
        >
          {listMode ? (
            /* Book mode: list all items as tiny text */
            <div className="vslider-book-list" aria-hidden="true">
              {items.map((name, i) => (
                <div
                  key={i}
                  className={`vslider-book-item${i === activeIdx ? ' active' : ''}`}
                >
                  {name}
                </div>
              ))}
            </div>
          ) : (
            /* Number mode: gradient fill */
            <>
              <div
                className="vslider-fill"
                style={{ height: `${fillPercent}%` }}
              />
              {/* Top / bottom labels inside track */}
              <span className="vslider-end-label top">{items[0]}</span>
              <span className="vslider-end-label bottom">{items[items.length - 1]}</span>
            </>
          )}

          {/* Selection indicator line */}
          <div
            className="vslider-thumb-line"
            style={{ top: `${fillPercent}%` }}
            aria-hidden="true"
          />
        </div>

        {/* Popup */}
        {dragging && (
          <div
            className="vslider-popup"
            style={{ top: `${popupY}%`, transform: 'translateY(-50%)' }}
          >
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
