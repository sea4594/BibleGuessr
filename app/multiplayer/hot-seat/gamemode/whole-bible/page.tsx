'use client';

import { useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { gameModes } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';
import { toTimerDurationSeconds } from '@/lib/timerOptions';

const MODE = gameModes['full-bible'];

export default function HotSeatWholeBiblePage() {
  const router = useRouter();
  const { startGame } = useGame();

  const handleStart = () => {
    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);

    startGame({
      mode: 'full-bible',
      modeConfig: MODE,
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
      <AppTopBar title="Whole Bible" backHref="/multiplayer/hot-seat/gamemode" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl setup-page">
          <h1 className="headline-serif text-4xl mb-4">Whole Bible</h1>

          <section className="setup-panel">
            <div className="setup-panel-section">
              <p className="content-muted">
                Start with your saved Hot Seat setup values for players, rounds per player, and timer.
              </p>
            </div>
          </section>

          <button onClick={handleStart} className="btn-primary setup-start-btn">Start Game</button>
        </div>
      </div>
    </main>
  );
}
