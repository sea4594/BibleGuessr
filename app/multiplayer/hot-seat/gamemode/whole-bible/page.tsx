'use client';

import { useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { gameModes } from '@/lib/gameModes';
import { readHotSeatSettings } from '@/lib/hotSeatSettings';

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
        <div className="page max-w-xl">
          <section className="surface-card p-5">
            <h1 className="headline-serif text-3xl mb-4">Whole Bible</h1>
            <p className="text-sm font-semibold mb-2 text-[var(--text-muted)]">Books in play ({MODE.books.length})</p>
            <div className="surface-card-soft p-3 mb-5 max-h-48 overflow-y-auto">
              <div className="flex flex-wrap gap-1">
                {MODE.books.map(b => (
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
