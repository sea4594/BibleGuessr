'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { gameModes } from '@/lib/gameModes';
import { DEFAULT_TIMER_MINUTES, DEFAULT_TIMER_SECONDS, toTimerDurationSeconds } from '@/lib/timerOptions';

const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function BookModeSetupPage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [rounds, setRounds] = useState(5);
  const [book, setBook] = useState(bibleData[0].book);
  const [surprise, setSurprise] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(DEFAULT_TIMER_MINUTES);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS);

  const handleStart = () => {
    const resolvedBook = surprise ? bibleData[Math.floor(Math.random() * bibleData.length)].book : book;
    const selected = bibleData.find(item => item.book === resolvedBook) ?? bibleData[0];
    startGame({
      mode: 'book-selection',
      modeConfig: { ...gameModes['book-selection'], books: [selected] },
      selectedBook: selected.book,
      randomizeBookOnReplay: surprise,
      totalRounds: rounds,
      timerDurationSeconds: toTimerDurationSeconds(timerMinutes, timerSeconds),
      returnPath: '/single-player',
    });
    router.push('/play/book-selection/game');
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Book Setup" backHref="/single-player" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-xl setup-page">
          <h1 className="headline-serif text-3xl sm:text-4xl setup-title">Book</h1>

          <section className="setup-panel">
            <div className="setup-panel-section">
              <HorizontalWheel label="Rounds" values={ROUND_VALUES} selected={rounds} onChange={setRounds} />
            </div>

            <div className="setup-panel-section">
              <TimerSetupControls
                embedded
                minutes={timerMinutes}
                seconds={timerSeconds}
                onMinutesChange={setTimerMinutes}
                onSecondsChange={setTimerSeconds}
              />
            </div>

            <div className="setup-panel-section">
              <label className="block text-sm font-semibold mb-2">Book Selection</label>
              <select
                value={book}
                onChange={e => setBook(e.target.value)}
                disabled={surprise}
                className="settings-input !w-full mb-3 disabled:opacity-40 text-xl py-5"
              >
                {bibleData.map(item => (
                  <option key={item.book} value={item.book}>{item.book}</option>
                ))}
              </select>

              <label className="setting-row">
                <span>Surprise me!</span>
                <input
                  type="checkbox"
                  checked={surprise}
                  onChange={e => setSurprise(e.target.checked)}
                  aria-label="Surprise me"
                />
              </label>
            </div>
          </section>

          <button onClick={handleStart} className="btn-primary setup-start-btn">Start</button>
        </div>
      </div>
    </main>
  );
}
