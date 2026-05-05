'use client';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { gameModes, GameModeId } from '@/lib/gameModes';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';

export default function ModePage() {
  const params = useParams();
  const router = useRouter();
  const { startGame } = useGame();
  const modeId = params.mode as GameModeId;
  const modeConfig = gameModes[modeId];
  const [rounds, setRounds] = useState(5);
  const [selectedBook, setSelectedBook] = useState(bibleData[0].book);

  if (!modeConfig) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
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
        <h1 className="headline-serif text-3xl sm:text-4xl text-amber-100 mb-2">{modeConfig.name}</h1>
        <p className="text-slate-300/90 mb-7 leading-relaxed">{modeConfig.description}</p>

        {modeConfig.isSingleBook && (
          <div className="mb-7">
            <label className="block text-slate-200 text-sm font-semibold mb-2">Select Book</label>
            <select
              value={selectedBook}
              onChange={e => setSelectedBook(e.target.value)}
              className="w-full bg-[rgba(9,20,34,0.65)] border border-[#6f7c95] text-slate-100 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#e5cf99] focus:ring-2 focus:ring-[#e5cf99]/30"
            >
              {bibleData.map(b => (
                <option key={b.book} value={b.book}>{b.book}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-7">
          <label className="block text-slate-200 text-sm font-semibold mb-2.5">Number of Rounds</label>
          <div className="flex gap-3">
            {[5, 10].map(n => (
              <button
                key={n}
                onClick={() => setRounds(n)}
                className={`flex-1 py-2.5 rounded-xl font-semibold transition-colors ${
                  rounds === n
                    ? 'bg-[#ddc68d] text-[#1c283d] border border-[#f2e1b8]'
                    : 'bg-[rgba(37,53,75,0.75)] text-slate-100 border border-[#4d5f7c] hover:bg-[rgba(55,74,102,0.8)]'
                }`}
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

        <button
          onClick={() => router.push('/')}
          className="btn-ghost w-full mt-3 py-2"
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}
