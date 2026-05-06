'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { gameModes, GameModeId } from '@/lib/gameModes';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { useUiSettings } from '@/lib/uiSettingsContext';
import AppTopBar from '@/components/AppTopBar';

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
    <main className="app-screen">
      <AppTopBar title="Game Setup" backHref="/single-player" />

      <div className="app-content app-content-scroll">
      <div className="page max-w-xl">
      <div className="surface-card fade-up p-5 w-full">
        <p className="eyebrow mb-2">Setup</p>
        <h1 className="headline-serif text-3xl sm:text-4xl mb-2">{modeConfig.name}</h1>
        <p className="content-muted mb-6">{modeConfig.description}</p>

        {modeConfig.isSingleBook && (
          <div className="mb-6">
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

        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2.5">Rounds</label>
          <div className="grid gap-2">
            {([5, 10] as const).map(n => (
              <button
                key={n}
                onClick={() => setRounds(n)}
                className={rounds === n ? 'btn-primary w-full py-2.5 font-semibold' : 'btn-outline w-full py-2.5 font-semibold'}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="btn-primary w-full py-3 text-lg"
        >
          Start
        </button>

        <div className="flex flex-wrap gap-3 mt-3">
          <button onClick={() => router.push('/single-player')} className="btn-ghost py-2">Modes</button>
        </div>
      </div>
      </div>
      </div>
    </main>
  );
}
