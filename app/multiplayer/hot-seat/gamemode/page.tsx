'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { gameModes } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';
import { toTimerDurationSeconds } from '@/lib/timerOptions';

type ModeChoice = 'full-bible' | 'sections' | 'book';

export default function HotSeatGamemodePage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [selectedMode, setSelectedMode] = useState<ModeChoice | null>(null);

  const modeCards = useMemo(() => [
    {
      id: 'full-bible' as const,
      title: 'Whole Bible',
      description: 'All 66 books with your hot-seat settings.',
    },
    {
      id: 'sections' as const,
      title: 'Section Mode',
      description: 'Choose from major sections of scripture.',
    },
    {
      id: 'book' as const,
      title: 'Book Mode',
      description: 'Play within one selected Bible book.',
    },
  ], []);

  const handleStart = () => {
    if (!selectedMode) return;

    if (selectedMode === 'sections') {
      router.push('/multiplayer/hot-seat/gamemode/sections');
      return;
    }

    if (selectedMode === 'book') {
      router.push('/multiplayer/hot-seat/gamemode/book');
      return;
    }

    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);

    startGame({
      mode: 'full-bible',
      modeConfig: gameModes['full-bible'],
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

    router.push('/play/full-bible/game');
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Hot Seat" backHref="/multiplayer" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-3xl">
          <h1 className="headline-serif text-3xl mb-1">Select Gamemode</h1>

          <section className="menu-grid">
            {modeCards.map(mode => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`surface-card mode-card text-left w-full ${selectedMode === mode.id ? 'mode-card-selected' : ''}`}
              >
                <h2 className="headline-serif text-2xl mb-1">{mode.title}</h2>
                <p className="content-muted text-sm">{mode.description}</p>
              </button>
            ))}
          </section>
        </div>
      </div>

      {selectedMode && (
        <div className="round-screen-footer">
          <div className="footer-inner">
            <button onClick={handleStart} className="btn-primary w-full py-4 text-xl font-extrabold">
              Start
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
