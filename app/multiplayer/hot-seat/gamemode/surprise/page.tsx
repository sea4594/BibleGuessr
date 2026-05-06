'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { gameModes, sectionModeIds, GameModeId } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';

const surprisePool: Array<'full-bible' | 'book-selection' | GameModeId> = [
  'full-bible',
  'book-selection',
  ...sectionModeIds,
];

export default function HotSeatSurprisePage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [resolved, setResolved] = useState<string | null>(null);

  const handleStart = () => {
    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);
    const selected = surprisePool[Math.floor(Math.random() * surprisePool.length)];
    setResolved(selected);

    if (selected === 'book-selection') {
      const randomBook = bibleData[Math.floor(Math.random() * bibleData.length)];
      startGame({
        mode: selected,
        modeConfig: { ...gameModes[selected], books: [randomBook] },
        totalRounds: settings.players * settings.rounds,
        selectedBook: randomBook.book,
        returnPath: '/multiplayer/hot-seat/gamemode',
        multiplayer: {
          enabled: true,
          lobbyType: 'hot-seat',
          players,
          roundsPerPlayer: settings.rounds,
          turnStyle: settings.turnStyle,
        },
      });
      router.push('/play/book-selection/game');
      return;
    }

    startGame({
      mode: selected,
      modeConfig: gameModes[selected],
      totalRounds: settings.players * settings.rounds,
      returnPath: '/multiplayer/hot-seat/gamemode',
      multiplayer: {
        enabled: true,
        lobbyType: 'hot-seat',
        players,
        roundsPerPlayer: settings.rounds,
        turnStyle: settings.turnStyle,
      },
    });
    router.push(`/play/${selected}/game`);
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Surprise Mode" backHref="/multiplayer/hot-seat/gamemode" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="surface-card p-5">
            <h1 className="headline-serif text-3xl mb-2">Surprise Me</h1>
            <p className="content-muted mb-5">Randomly picks Whole Bible, Section, or Book mode.</p>
            {resolved && <p className="mb-4 text-sm">Picked mode: <strong>{gameModes[resolved as GameModeId]?.name ?? 'Book Selection'}</strong></p>}
            <button onClick={handleStart} className="btn-primary w-full py-3 text-lg">Start Surprise Game</button>
          </section>
        </div>
      </div>
    </main>
  );
}
