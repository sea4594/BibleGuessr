'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import { useGame } from '@/lib/gameContext';
import { gameModes, GameModeId, sectionModeIds } from '@/lib/gameModes';
import { DEFAULT_TIMER_SECONDS, toTimerDurationSeconds } from '@/lib/timerOptions';

const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SectionSetupPage() {
  const params = useParams();
  const router = useRouter();
  const { startGame } = useGame();
  const [rounds, setRounds] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS);
  const modeId = params.mode as GameModeId;

  if (!sectionModeIds.includes(modeId)) {
    return (
      <main className="app-screen">
        <AppTopBar title="Category Setup" backHref="/single-player/sections" />
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
    startGame({
      mode: modeId,
      modeConfig: mode,
      totalRounds: rounds,
      timerDurationSeconds: toTimerDurationSeconds(timerSeconds),
      returnPath: '/single-player/sections',
    });
    router.push(`/play/${modeId}/game`);
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Category Setup" backHref="/single-player/sections" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-xl setup-page">
          <h1 className="headline-serif text-3xl sm:text-4xl setup-title">{mode.name}</h1>

          <section className="setup-panel">
            <div className="setup-panel-section">
              <HorizontalWheel label="Rounds" values={ROUND_VALUES} selected={rounds} onChange={setRounds} />
            </div>

            <div className="setup-panel-section">
              <TimerSetupControls
                embedded
                seconds={timerSeconds}
                onSecondsChange={setTimerSeconds}
              />
            </div>
          </section>

          <button onClick={handleStart} className="btn-primary setup-start-btn">Start</button>
        </div>
      </div>
    </main>
  );
}
