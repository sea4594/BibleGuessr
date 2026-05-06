'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import HorizontalWheel from '@/components/HorizontalWheel';
import { useGame } from '@/lib/gameContext';
import { gameModes } from '@/lib/gameModes';

const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
        <div className="page max-w-xl setup-page">
          <h1 className="headline-serif text-3xl sm:text-4xl setup-title">Whole Bible Mode</h1>

          <section className="surface-card p-4 sm:p-5">
            <HorizontalWheel label="Rounds" values={ROUND_VALUES} selected={rounds} onChange={setRounds} />
          </section>

          <button onClick={handleStart} className="btn-primary setup-start-btn">
            Start
          </button>
        </div>
      </div>
    </main>
  );
}
