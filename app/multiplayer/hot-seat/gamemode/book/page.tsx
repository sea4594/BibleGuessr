'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { gameModes } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';
import { toTimerDurationSeconds } from '@/lib/timerOptions';

export default function HotSeatBookModePage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [book, setBook] = useState(bibleData[0].book);

  const handleStart = () => {
    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);
    const selected = bibleData.find(item => item.book === book) ?? bibleData[0];

    startGame({
      mode: 'book-selection',
      modeConfig: { ...gameModes['book-selection'], books: [selected] },
      totalRounds: settings.players * settings.rounds,
      timerDurationSeconds: toTimerDurationSeconds(settings.timerMinutes, settings.timerSeconds),
      selectedBook: selected.book,
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
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Book Setup" backHref="/multiplayer/hot-seat/gamemode" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="setup-panel">
            <div className="setup-panel-section">
              <h1 className="headline-serif text-3xl mb-4">Book</h1>

              <select
                value={book}
                onChange={e => setBook(e.target.value)}
                className="settings-input !w-full text-lg py-4"
              >
                {bibleData.map(item => (
                  <option key={item.book} value={item.book}>{item.book}</option>
                ))}
              </select>
            </div>
          </section>

          <button onClick={handleStart} className="btn-primary w-full py-3 text-lg">Start</button>
        </div>
      </div>
    </main>
  );
}
