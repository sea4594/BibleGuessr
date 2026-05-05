'use client';
import Link from 'next/link';
import { gameModes, GameModeId } from '@/lib/gameModes';

const modeOrder: GameModeId[] = [
  'full-bible', 'old-testament', 'new-testament', 'pentateuch',
  'historical', 'wisdom', 'major-prophets', 'minor-prophets',
  'gospels', 'pauline-epistles', 'general-epistles', 'all-epistles',
  'book-selection',
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 px-4 py-12">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-amber-400 mb-2">BibleGuessr</h1>
          <p className="text-slate-300 text-lg">Guess where Bible verses are located</p>
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modeOrder.map(modeId => {
            const mode = gameModes[modeId];
            return (
              <div
                key={modeId}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col hover:border-amber-500 transition-colors"
              >
                <h2 className="text-xl font-semibold text-white mb-1">{mode.name}</h2>
                <p className="text-slate-400 text-sm mb-4 flex-1">{mode.description}</p>
                <Link
                  href={`/play/${modeId}`}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-2 px-4 rounded-lg text-center transition-colors"
                >
                  Play
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
