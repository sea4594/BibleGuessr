'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import CustomBookSelectorPopup from '@/components/CustomBookSelectorPopup';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { gameModes } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';
import { toTimerDurationSeconds } from '@/lib/timerOptions';

export default function HotSeatCustomModePage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [selectedBooks, setSelectedBooks] = useState<string[]>(() => bibleData.map(book => book.book));

  const handleStart = () => {
    if (selectedBooks.length === 0) return;

    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);
    const books = bibleData.filter(book => selectedBooks.includes(book.book));
    if (books.length === 0) return;

    startGame({
      mode: 'custom',
      modeConfig: { ...gameModes.custom, books },
      totalRounds: settings.players * settings.rounds,
      timerDurationSeconds: toTimerDurationSeconds(settings.timerSeconds),
      returnPath: '/multiplayer/hot-seat/gamemode',
      multiplayer: {
        enabled: true,
        lobbyType: 'hot-seat',
        players,
        roundsPerPlayer: settings.rounds,
        turnStyle: settings.turnStyle,
      },
    });

    router.push('/play/custom/game');
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Custom Setup" backHref="/multiplayer/hot-seat/gamemode" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="setup-panel">
            <div className="setup-panel-section">
              <h1 className="headline-serif text-3xl mb-4">Custom</h1>
              <CustomBookSelectorPopup selectedBooks={selectedBooks} onChange={setSelectedBooks} />
              {selectedBooks.length === 0 && (
                <p className="text-xs text-[var(--danger)] mt-2">Select at least one book to start.</p>
              )}
            </div>
          </section>

          <button
            onClick={handleStart}
            disabled={selectedBooks.length === 0}
            className="btn-primary w-full py-3 text-lg disabled:opacity-50"
          >
            Start
          </button>
        </div>
      </div>
    </main>
  );
}
