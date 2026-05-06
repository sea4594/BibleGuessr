'use client';

import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { gameModes } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';

const MODE = gameModes['full-bible'];
const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const ITEM_W = 60;

function HScrollPicker({ label, values, selected, onChange }: { label: string; values: number[]; selected: number; onChange: (v: number) => void }) {
  const listRef = useRef<HTMLDivElement>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { const idx = values.indexOf(selected); if (idx >= 0 && listRef.current) listRef.current.scrollLeft = idx * ITEM_W; }, [selected, values]);
  const handleScroll = () => {
    if (!listRef.current) return;
    if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    scrollTimeout.current = setTimeout(() => {
      if (!listRef.current) return;
      const idx = Math.round(listRef.current.scrollLeft / ITEM_W);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      listRef.current.scrollLeft = clamped * ITEM_W;
      onChange(values[clamped]);
    }, 120);
  };
  return (
    <div className="h-scroll-picker-wrap">
      <span className="h-scroll-picker-label">{label}</span>
      <div ref={listRef} className="h-scroll-picker" onScroll={handleScroll}>
        {values.map(v => (<div key={v} className={`h-scroll-picker-item${v === selected ? ' selected' : ''}`} onClick={() => onChange(v)}>{v}</div>))}
      </div>
    </div>
  );
}

export default function HotSeatWholeBiblePage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [rounds, setRounds] = useState(1);

  const handleStart = () => {
    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);
    startGame({
      mode: 'full-bible',
      modeConfig: MODE,
      totalRounds: settings.players * rounds,
      returnPath: '/multiplayer/hot-seat/gamemode',
      multiplayer: {
        enabled: true,
        lobbyType: 'hot-seat',
        players,
        roundsPerPlayer: rounds,
        turnStyle: settings.turnStyle,
      },
    });
    router.push('/play/full-bible/game');
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Whole Bible" backHref="/multiplayer/hot-seat/gamemode" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl pb-6">
          <h1 className="headline-serif text-4xl mb-4">Whole Bible</h1>
          <p className="text-sm font-semibold mb-3 text-[var(--text-muted)]">Books in play ({MODE.books.length})</p>
          <div className="surface-card-soft p-3 mb-6 max-h-32 overflow-y-auto">
            <div className="flex flex-wrap gap-1">
              {MODE.books.map(b => (<span key={b.book} className="text-xs bg-[var(--panel)] border border-[var(--line)] rounded px-1.5 py-0.5">{b.book}</span>))}
            </div>
          </div>

          <div className="mb-12">
            <HScrollPicker label="Rounds per player" values={ROUND_VALUES} selected={rounds} onChange={setRounds} />
          </div>

          <button onClick={handleStart} className="btn-primary w-full py-5 text-xl font-bold fixed bottom-10 left-4 right-4 max-w-lg mx-auto" style={{ maxWidth: 'calc(100% - 32px)' }}>Start Game</button>
        </div>
      </div>
    </main>
  );
}
