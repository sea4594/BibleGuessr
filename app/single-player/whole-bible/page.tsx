'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { gameModes } from '@/lib/gameModes';

export default function WholeBibleSetupPage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [rounds, setRounds] = useState(5);

  const handleStart = () => {
    startGame({
      mode: 'full-bible',
      modeConfig: gameModes['full-bible'],
      totalRounds: rounds,
      returnPath: '/single-player',
    });
    router.push('/play/full-bible/game');
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Whole Bible Setup" backHref="/single-player" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="surface-card p-5">
            <p className="eyebrow mb-2">Setup</p>
            <h1 className="headline-serif text-3xl mb-2">Whole Bible Mode</h1>
            <p className="content-muted mb-5">Choose rounds with the wheel and start.</p>

            <label className="block mb-2 text-sm font-semibold">Rounds: {rounds}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={rounds}
              onChange={e => setRounds(parseInt(e.target.value, 10))}
              className="w-full mb-6"
            />

            <button onClick={handleStart} className="btn-primary w-full py-3 text-lg">Start</button>
          </section>
        </div>
      </div>
    </main>
  );
}
