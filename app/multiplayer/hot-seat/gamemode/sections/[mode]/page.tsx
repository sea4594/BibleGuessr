'use client';

import { useParams, useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { gameModes, GameModeId, sectionModeIds } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';

export default function HotSeatSectionSetupPage() {
  const params = useParams();
  const router = useRouter();
  const { startGame } = useGame();
  const modeId = params.mode as GameModeId;

  if (!sectionModeIds.includes(modeId)) {
    return (
      <main className="app-screen">
        <AppTopBar title="Section Setup" backHref="/multiplayer/hot-seat/gamemode/sections" />
        <div className="app-content app-content-scroll">
          <div className="page max-w-xl">
            <section className="surface-card p-5">Invalid section mode.</section>
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
          <section className="surface-card p-5">
            <h1 className="headline-serif text-3xl mb-4">{mode.name}</h1>
            <p className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Books in play ({mode.books.length})</p>
            <div className="surface-card-soft p-3 mb-5 max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {mode.books.map(b => (
                  <span key={b.book} className="text-xs bg-[var(--panel)] border border-[var(--line)] rounded px-1.5 py-0.5">{b.book}</span>
                ))}
              </div>
            </div>
            <button onClick={handleStart} className="btn-primary w-full py-3 text-lg">Start</button>
          </section>
        </div>
      </div>
    </main>
  );
}
