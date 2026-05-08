'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import TimerSetupControls from '@/components/TimerSetupControls';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { gameModes, sectionModeIds, GameModeId } from '@/lib/gameModes';
import { readHotSeatSettings, writeHotSeatSettings } from '@/lib/hotSeatSettings';
import { toTimerDurationSeconds } from '@/lib/timerOptions';

const surprisePool: Array<'full-bible' | 'book-selection' | GameModeId> = [
  'full-bible',
  'book-selection',
  ...sectionModeIds,
];

export default function HotSeatSurprisePage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [resolved, setResolved] = useState<string | null>(null);
  const initialSettings = readHotSeatSettings();
  const [timerSeconds, setTimerSeconds] = useState(initialSettings.timerSeconds);

  const handleStart = () => {
    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);
    const selected = surprisePool[Math.floor(Math.random() * surprisePool.length)];
    writeHotSeatSettings({ ...settings, timerSeconds });
    setResolved(selected);

    if (selected === 'book-selection') {
      const randomBook = bibleData[Math.floor(Math.random() * bibleData.length)];
      startGame({
        mode: selected,
        modeConfig: { ...gameModes[selected], books: [randomBook] },
        totalRounds: settings.players * settings.rounds,
        timerDurationSeconds: toTimerDurationSeconds(timerSeconds),
        selectedBook: randomBook.book,
        randomizeBookOnReplay: true,
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
      timerDurationSeconds: toTimerDurationSeconds(timerSeconds),
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
          <section className="setup-panel">
            <div className="setup-panel-section">
              <h1 className="headline-serif text-3xl mb-2">Surprise Me</h1>
              <p className="content-muted">Randomly picks Whole Bible, Category, or Book.</p>
            </div>
            <div className="setup-panel-section">
              <TimerSetupControls
                embedded
                seconds={timerSeconds}
                onSecondsChange={setTimerSeconds}
              />
            </div>
            {resolved && (
              <div className="setup-panel-section">
                <p className="text-sm">Picked mode: <strong>{gameModes[resolved as GameModeId]?.name ?? 'Book Selection'}</strong></p>
              </div>
            )}
          </section>
          <button onClick={handleStart} className="btn-primary w-full py-3 text-lg">Start Surprise Game</button>
        </div>
      </div>
    </main>
  );
}
