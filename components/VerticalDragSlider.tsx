'use client';
import { useCallback, useRef, useState } from 'react';

export interface VerticalSliderItemColor {
  background: string;
  text: string;
}

interface Props {
  items: string[];
  selectedIndex: number | null;
  onChange: (index: number) => void;
  label: string;
  disabled?: boolean;
  itemColors?: Array<VerticalSliderItemColor | null>;
}

// Upward calibration: fingertip registers at center of touch, but the visible
// tip is this many px higher. Adjust so the selected item matches where the
// user actually points.
const CALIBRATION_OFFSET = 0;
const POPUP_H = 130; // approximate popup height, px

export default function VerticalDragSlider({
  items,
  selectedIndex,
  onChange,
  label,
  disabled = false,
  itemColors,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [hoveringMouse, setHoveringMouse] = useState(false);
  const [hoverIdx, setHoverIdx] = useState(selectedIndex ?? 0);
  const [popupPosition, setPopupPosition] = useState({ top: 4, left: 72 });

  const compute = useCallback((clientY: number) => {
    if (items.length === 0) return { idx: 0, px: 0 };
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return { idx: 0, px: 0 };
    const adjusted = clientY - CALIBRATION_OFFSET;
    const px = Math.min(rect.height, Math.max(0, adjusted - rect.top));
    const frac = rect.height > 0 ? px / rect.height : 0;
    const idx = Math.round(frac * (items.length - 1));
    return { idx, px };
  }, [items.length]);

  const positionPopup = useCallback((clientY: number) => {
    const rect = trackRef.current?.getBoundingClientRect();
    if (!rect) return;
    const halfPopupWidth = 66;
    const left = Math.min(
      window.innerWidth - halfPopupWidth - 4,
      Math.max(halfPopupWidth + 4, rect.left + rect.width / 2)
    );
    const top = Math.max(4, clientY - POPUP_H - 10);
    setPopupPosition({ top, left });
  }, []);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || items.length === 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const { idx } = compute(e.clientY);
    setHoverIdx(idx);
    positionPopup(e.clientY);
    if (e.pointerType === 'mouse') {
      setHoveringMouse(true);
    }
    setDragging(true);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (!dragging && e.pointerType !== 'mouse') return;

    const { idx } = compute(e.clientY);
    setHoverIdx(idx);
    positionPopup(e.clientY);

    if (!dragging && e.pointerType === 'mouse') {
      setHoveringMouse(true);
    }
  };

  const onEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || items.length === 0 || e.pointerType !== 'mouse') return;
    const { idx } = compute(e.clientY);
    setHoverIdx(idx);
    positionPopup(e.clientY);
    setHoveringMouse(true);
  };

  const onLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse') {
      setHoveringMouse(false);
    }
  };

  const onUp = () => {
    if (dragging && items.length > 0) onChange(hoverIdx);
    setDragging(false);
  };

  const showPopup = (dragging || hoveringMouse) && !disabled && items.length > 0;

  const activeIdx = dragging
    ? (items.length > 0 ? Math.max(0, Math.min(items.length - 1, hoverIdx)) : null)
    : selectedIndex;
  const itemHeightPercent = items.length > 0 ? 100 / items.length : 100;
  const dynamicFontPx = Math.max(4, Math.min(14, Math.floor(220 / Math.max(items.length, 1))));

  // 5-item context window
  const contextItems = [-2, -1, 0, 1, 2].map(off => {
    const i = hoverIdx + off;
    return i < 0 || i >= items.length ? null : { index: i, label: items[i], isCenter: off === 0 };
  });
  const activeColor = activeIdx === null ? null : (itemColors?.[activeIdx] ?? null);

  return (
    <div className={`vslider-col${disabled ? ' opacity-40' : ''}`}>
      <p className="vslider-label">{label}</p>
      <p
        className="vslider-selected-val"
        style={activeColor ? { backgroundColor: activeColor.background, color: activeColor.text, borderRadius: '6px', padding: '2px 5px' } : undefined}
      >
        {disabled ? '—' : (activeIdx === null ? '—' : (items[activeIdx] ?? '—'))}
      </p>

      <div className="vslider-track-wrap">
        <div
          ref={trackRef}
          className="vslider-track"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onPointerEnter={onEnter}
          onPointerLeave={onLeave}
          style={{ touchAction: 'none', cursor: disabled ? 'default' : 'pointer' }}
        >
          <div className="vslider-book-list" aria-hidden="true">
            {items.map((name, i) => {
              const itemColor = itemColors?.[i] ?? null;
              const isActive = activeIdx !== null && i === activeIdx;
              return (
                <div
                  key={i}
                  className={`vslider-book-item${isActive ? ' active' : ''}`}
                  style={{
                    height: `${itemHeightPercent}%`,
                    minHeight: `${itemHeightPercent}%`,
                    lineHeight: `${itemHeightPercent}%`,
                    fontSize: `${dynamicFontPx}px`,
                    ...(itemColor ? {
                      backgroundColor: itemColor.background,
                      color: itemColor.text,
                      boxShadow: isActive ? 'inset 0 0 0 1.5px rgba(255,255,255,0.95), inset 0 0 0 3px rgba(0,0,0,0.24)' : undefined,
                    } : {}),
                  }}
                >
                  {name}
                </div>
              );
            })}
          </div>

        </div>

        {showPopup && (
          <div className="vslider-popup vslider-popup-above" style={{ top: `${popupPosition.top}px`, left: `${popupPosition.left}px` }}>
            {contextItems.map((item, i) =>
              item === null ? (
                <div key={i} className="vslider-popup-item empty" />
              ) : (
                <div
                  key={i}
                  className={`vslider-popup-item${item.isCenter ? ' center' : ''}`}
                  style={itemColors?.[item.index] ? {
                    backgroundColor: itemColors[item.index]!.background,
                    color: itemColors[item.index]!.text,
                    boxShadow: item.isCenter ? 'inset 0 0 0 2px rgba(255,255,255,0.9), 0 0 0 1px rgba(0,0,0,0.2)' : undefined,
                  } : undefined}
                >
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
