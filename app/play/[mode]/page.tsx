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
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
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
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-amber-400 mb-2">{modeConfig.name}</h1>
        <p className="text-slate-400 mb-6">{modeConfig.description}</p>

        {modeConfig.isSingleBook && (
          <div className="mb-6">
            <label className="block text-slate-300 text-sm font-medium mb-2">Select Book</label>
            <select
              value={selectedBook}
              onChange={e => setSelectedBook(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
            >
              {bibleData.map(b => (
                <option key={b.book} value={b.book}>{b.book}</option>
              ))}
            </select>
          </div>
        )}

        <div className="mb-6">
          <label className="block text-slate-300 text-sm font-medium mb-2">Number of Rounds</label>
          <div className="flex gap-3">
            {[5, 10].map(n => (
              <button
                key={n}
                onClick={() => setRounds(n)}
                className={`flex-1 py-2 rounded-lg font-bold transition-colors ${
                  rounds === n
                    ? 'bg-amber-500 text-slate-900'
                    : 'bg-slate-700 text-white hover:bg-slate-600'
                }`}
              >
                {n} Rounds
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStart}
          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 rounded-lg text-lg transition-colors"
        >
          Start Game
        </button>

        <button
          onClick={() => router.push('/')}
          className="w-full mt-3 text-slate-400 hover:text-white py-2 transition-colors"
        >
          ← Back to Home
        </button>
      </div>
    </main>
  );
}
