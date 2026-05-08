'use client';

import { useParams, useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { gameModes, GameModeId, sectionModeIds } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';
import { toTimerDurationSeconds } from '@/lib/timerOptions';

export default function HotSeatSectionSetupPage() {
  const params = useParams();
  const router = useRouter();
  const { startGame } = useGame();
  const modeId = params.mode as GameModeId;

  if (!sectionModeIds.includes(modeId)) {
    return (
      <main className="app-screen">
        <AppTopBar title="Category Setup" backHref="/multiplayer/hot-seat/gamemode/sections" />
        <div className="app-content app-content-scroll">
          <div className="page max-w-xl">
            <section className="surface-card p-5">Invalid category.</section>
          </div>
        </div>
      </main>
    );
  }

  const mode = gameModes[modeId];

  const handleStart = () => {
    const settings = readHotSeatSettings();
    const players = settings.names.slice(0, settings.players).map((name, idx) => name || `Player ${idx + 1}`);

    startGame({
      mode: modeId,
      modeConfig: mode,
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

    router.push(`/play/${modeId}/game`);
  };

  return (
    <main className="app-screen">
      <AppTopBar title={mode.name} backHref="/multiplayer/hot-seat/gamemode/sections" />
      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="setup-panel">
            <div className="setup-panel-section">
              <h1 className="headline-serif text-3xl">{mode.name}</h1>
              <p className="content-muted mt-2">Starts with your Hot Seat setup values.</p>
            </div>
          </section>
          <button onClick={handleStart} className="btn-primary w-full py-3 text-lg">Start</button>
        </div>
      </div>
    </main>
  );
}
