'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { gameModes, GameModeId, sectionModeIds } from '@/lib/gameModes';

export default function SectionSetupPage() {
  const params = useParams();
  const router = useRouter();
  const { startGame } = useGame();
  const [rounds, setRounds] = useState(5);
  const modeId = params.mode as GameModeId;

  if (!sectionModeIds.includes(modeId)) {
    return (
      <main className="app-screen">
        <AppTopBar title="Section Setup" backHref="/single-player/sections" />
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
    startGame({
      mode: modeId,
      modeConfig: mode,
      totalRounds: rounds,
      returnPath: '/single-player/sections',
    });
    router.push(`/play/${modeId}/game`);
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Section Setup" backHref="/single-player/sections" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="surface-card p-5">
            <p className="eyebrow mb-2">Setup</p>
            <h1 className="headline-serif text-3xl mb-2">{mode.name}</h1>
            <p className="content-muted mb-5">Set rounds and start.</p>

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
