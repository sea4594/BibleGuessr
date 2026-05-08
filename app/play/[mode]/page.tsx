'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { gameModes, GameModeId } from '@/lib/gameModes';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { useUiSettings } from '@/lib/uiSettingsContext';
import AppTopBar from '@/components/AppTopBar';
import HorizontalWheel from '@/components/HorizontalWheel';
import TimerSetupControls from '@/components/TimerSetupControls';
import { DEFAULT_TIMER_MINUTES, DEFAULT_TIMER_SECONDS, toTimerDurationSeconds } from '@/lib/timerOptions';

const ROUND_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export default function ModePage() {
  const params = useParams();
  const router = useRouter();
  const { startGame } = useGame();
  const { settings } = useUiSettings();
  const modeId = params.mode as GameModeId;
  const modeConfig = gameModes[modeId];
  const [rounds, setRounds] = useState<number>(settings.preferredRounds);
  const [selectedBook, setSelectedBook] = useState(bibleData[0].book);
  const [timerMinutes, setTimerMinutes] = useState(DEFAULT_TIMER_MINUTES);
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS);


  if (!modeConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Mode not found
      </div>
    );
  }

  const handleStart = () => {
    const bookForMode = modeConfig.isSingleBook
      ? { ...modeConfig, books: [bibleData.find(b => b.book === selectedBook)!] }
      : modeConfig;

    startGame({
      mode: modeId,
      modeConfig: bookForMode,
      totalRounds: rounds,
      timerDurationSeconds: toTimerDurationSeconds(timerMinutes, timerSeconds),
      selectedBook: modeConfig.isSingleBook ? selectedBook : undefined,
    });
    router.push(`/play/${modeId}/game`);
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Game Setup" backHref="/single-player" />

      <div className="app-content app-content-scroll">
      <div className="page max-w-xl setup-page">
        <h1 className="headline-serif text-3xl sm:text-4xl setup-title">{modeConfig.name}</h1>
        <p className="content-muted mb-3">{modeConfig.description}</p>

      <section className="setup-panel fade-up w-full">
        {modeConfig.isSingleBook && (
          <div className="setup-panel-section">
            <label className="block text-sm font-semibold mb-2">Book</label>
            <select
              value={selectedBook}
              onChange={e => setSelectedBook(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--panel-soft)] border border-[var(--line-strong)] focus:outline-none"
            >
              {bibleData.map(b => (
                <option key={b.book} value={b.book}>{b.book}</option>
              ))}
            </select>
          </div>
        )}

        <div className="setup-panel-section">
          <HorizontalWheel label="Rounds" values={[...ROUND_VALUES]} selected={rounds} onChange={setRounds} />
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
      </section>

      <button
        onClick={handleStart}
        className="btn-primary setup-start-btn"
      >
        Start
      </button>
      </div>
      </div>
    </main>
  );
}
