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
    <main className="min-h-screen px-4 py-10 sm:px-6 sm:py-14">
      <div className="max-w-6xl mx-auto fade-up">
        <header className="surface-card relative overflow-hidden p-8 sm:p-12 mb-8 sm:mb-12">
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-amber-200/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-56 w-56 rounded-full bg-sky-200/10 blur-3xl" />

          <p className="eyebrow mb-4">Scripture Challenge</p>
          <h1 className="headline-serif text-5xl sm:text-6xl lg:text-7xl text-amber-100 leading-[0.95] mb-4">
            BibleGuessr
          </h1>
          <p className="text-slate-200/90 text-base sm:text-lg max-w-2xl leading-relaxed">
            Discover verses, trust your instinct, and pinpoint exactly where each passage lives in scripture.
          </p>
          <div className="mt-7 flex flex-wrap gap-3 text-sm text-slate-300">
            <span className="surface-card-soft px-3 py-1.5">Multiple game modes</span>
            <span className="surface-card-soft px-3 py-1.5">Scoring by precision</span>
            <span className="surface-card-soft px-3 py-1.5">Quick rounds</span>
          </div>
        </header>

        <div className="mode-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {modeOrder.map(modeId => {
            const mode = gameModes[modeId];
            return (
              <div
                key={modeId}
                className="surface-card p-5 sm:p-6 flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
              >
                <p className="eyebrow mb-3">Mode</p>
                <h2 className="headline-serif text-2xl text-slate-100 mb-2">{mode.name}</h2>
                <p className="text-slate-300/85 text-sm leading-relaxed mb-5 flex-1">{mode.description}</p>
                <Link
                  href={`/play/${modeId}`}
                  className="btn-primary py-2.5 px-4 text-center"
                >
                  Start Mode
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
