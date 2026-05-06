'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import AppTopBar from '@/components/AppTopBar';
import { useGame } from '@/lib/gameContext';
import { bibleData } from '@/lib/bibleData';
import { gameModes } from '@/lib/gameModes';

export default function BookModeSetupPage() {
  const router = useRouter();
  const { startGame } = useGame();
  const [rounds, setRounds] = useState(5);
  const [book, setBook] = useState(bibleData[0].book);
  const [surprise, setSurprise] = useState(false);

  const handleStart = () => {
    const resolvedBook = surprise
      ? bibleData[Math.floor(Math.random() * bibleData.length)].book
      : book;

    const selected = bibleData.find(item => item.book === resolvedBook) ?? bibleData[0];
    startGame({
      mode: 'book-selection',
      modeConfig: { ...gameModes['book-selection'], books: [selected] },
      selectedBook: selected.book,
      totalRounds: rounds,
      returnPath: '/single-player',
    });
    router.push('/play/book-selection/game');
  };

  return (
    <main className="app-screen">
      <AppTopBar title="Book Mode Setup" backHref="/single-player" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-xl">
          <section className="surface-card p-5">
            <p className="eyebrow mb-2">Setup</p>
            <h1 className="headline-serif text-3xl mb-2">Book Mode</h1>
            <p className="content-muted mb-5">Choose rounds and your book, or surprise yourself.</p>

            <label className="block mb-2 text-sm font-semibold">Rounds: {rounds}</label>
            <input
              type="range"
              min={1}
              max={10}
              value={rounds}
              onChange={e => setRounds(parseInt(e.target.value, 10))}
              className="w-full mb-6"
            />

            <label className="block text-sm font-semibold mb-2">Book Selection</label>
            <select
              value={book}
              onChange={e => setBook(e.target.value)}
              disabled={surprise}
              className="settings-input !w-full mb-3 disabled:opacity-40"
            >
              {bibleData.map(item => (
                <option key={item.book} value={item.book}>{item.book}</option>
              ))}
            </select>

            <label className="setting-row mb-6">
              <span>Surprise me!</span>
              <input
                type="checkbox"
                checked={surprise}
                onChange={e => setSurprise(e.target.checked)}
                aria-label="Surprise me"
              />
            </label>

            <button onClick={handleStart} className="btn-primary w-full py-3 text-lg">Start</button>
          </section>
        </div>
      </div>
    </main>
  );
}
