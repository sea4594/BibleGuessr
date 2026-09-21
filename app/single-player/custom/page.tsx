'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppTopBar from '@/components/AppTopBar';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import CustomBookSelector from '@/components/CustomBookSelector';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { gameModes } from '@/lib/gameModes';
import { DEFAULT_TIMER_SECONDS, toTimerDurationSeconds } from '@/lib/timerOptions';

const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function CustomModeSetupPage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [rounds, setRounds] = useState(5);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS);
  const [selectedBooks, setSelectedBooks] = useState<string[]>(() => bibleData.map(book => book.book));

  const handleStart = () => {
    if (selectedBooks.length === 0) return;

    const books = bibleData.filter(book => selectedBooks.includes(book.book));
    if (books.length === 0) return;

    startGame({
      mode: 'custom',
      modeConfig: { ...gameModes.custom, books },
      totalRounds: rounds,
      timerDurationSeconds: toTimerDurationSeconds(timerSeconds),
      returnPath: '/single-player',
    });

    router.push('/play/custom/game');
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Custom Setup" backHref="/single-player" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-xl setup-page">
          <h1 className="headline-serif text-3xl sm:text-4xl setup-title">Custom</h1>

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

            <div className="setup-panel-section">
              <label className="block text-sm font-semibold mb-2">Book Selection</label>
              <CustomBookSelector selectedBooks={selectedBooks} onChange={setSelectedBooks} />
              {selectedBooks.length === 0 && (
                <p className="text-xs text-[var(--danger)] mt-2">Select at least one book to start.</p>
              )}
            </div>
          </section>

          <button
            onClick={handleStart}
            disabled={selectedBooks.length === 0}
            className="btn-primary setup-start-btn disabled:opacity-50"
          >
            Start
          </button>
        </div>
      </div>
    </main>
  );
}
