'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { gameModes, GameModeId } from '@/lib/gameModes';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { useUiSettings } from '@/lib/uiSettingsContext';

export default function ModePage() {
  const params = useParams();
  const router = useRouter();
  const { startGame } = useGame();
  const { settings } = useUiSettings();
  const modeId = params.mode as GameModeId;
  const modeConfig = gameModes[modeId];
  const [rounds, setRounds] = useState<5 | 10>(settings.preferredRounds);
  const [selectedBook, setSelectedBook] = useState(bibleData[0].book);


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
      selectedBook: modeConfig.isSingleBook ? selectedBook : undefined,
    });
    router.push(`/play/${modeId}/game`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 sm:py-12">
      <div className="surface-card fade-up p-7 sm:p-8 max-w-xl w-full">
        <p className="eyebrow mb-3">Game Setup</p>
        <h1 className="headline-serif text-3xl sm:text-4xl mb-2">{modeConfig.name}</h1>
        <p className="content-muted mb-7 leading-relaxed">{modeConfig.description}</p>

        {modeConfig.isSingleBook && (
          <div className="mb-7">
            <label className="block text-sm font-semibold mb-2">Select Book</label>
            <select
              value={selectedBook}
              onChange={e => setSelectedBook(e.target.value)}
              className="w-full rounded-xl px-3.5 py-2.5 bg-[var(--surface-soft)] border border-[var(--line)] focus:outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20"
            >
              {bibleData.map(b => (
                <option key={b.book} value={b.book}>{b.book}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-7">
          <label className="block text-sm font-semibold mb-2.5">Number of Rounds</label>
          <div className="flex gap-3">
            {([5, 10] as const).map(n => (
              <button
                key={n}
                onClick={() => setRounds(n)}
                className={rounds === n ? 'btn-primary flex-1 py-2.5 rounded-xl font-semibold' : 'btn-outline flex-1 py-2.5 rounded-xl font-semibold'}
              >
                {n} Rounds
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="btn-primary w-full py-3 text-lg"
        >
          Start Game
        </button>

        <div className="flex flex-wrap gap-3 mt-3">
          <button
            onClick={() => router.push('/single-player')}
            className="btn-ghost py-2"
          >
            ← Back to Modes
          </button>
          <button
            onClick={() => router.push('/settings')}
            className="btn-outline ml-auto px-3 py-2 text-sm"
          >
            Theme & Settings
          </button>
        </div>
      </div>
    </main>
  );
}
