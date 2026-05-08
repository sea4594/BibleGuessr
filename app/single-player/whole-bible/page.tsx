'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import { useGame } from '@/lib/gameContext';
import { gameModes } from '@/lib/gameModes';
import { DEFAULT_TIMER_SECONDS, toTimerDurationSeconds } from '@/lib/timerOptions';

const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function WholeBibleSetupPage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [rounds, setRounds] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS);

  const handleStart = () => {
    startGame({
      mode: 'full-bible',
      modeConfig: gameModes['full-bible'],
      totalRounds: rounds,
      timerDurationSeconds: toTimerDurationSeconds(timerSeconds),
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

          <button onClick={handleStart} className="btn-primary setup-start-btn">
            Start
          </button>
        </div>
      </div>
    </main>
  );
}
