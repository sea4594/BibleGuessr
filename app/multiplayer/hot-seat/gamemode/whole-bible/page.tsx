'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import HorizontalWheel from '@/components/HorizontalWheel';
import { useGame } from '@/lib/gameContext';
import { gameModes } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';

const MODE = gameModes['full-bible'];
const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
        <div className="page max-w-xl setup-page">
          <h1 className="headline-serif text-4xl mb-4">Whole Bible</h1>

          <section className="surface-card p-4 sm:p-5">
            <HorizontalWheel label="Rounds per player" values={ROUND_VALUES} selected={rounds} onChange={setRounds} />
          </section>

          <button onClick={handleStart} className="btn-primary setup-start-btn">Start Game</button>
        </div>
      </div>
    </main>
  );
}
