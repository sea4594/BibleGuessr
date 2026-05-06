'use client';
import Link from 'next/link';
import { gameModes, GameModeId } from '@/lib/gameModes';

const modeOrder: GameModeId[] = [
  'full-bible', 'old-testament', 'new-testament', 'pentateuch',
  'historical', 'wisdom', 'major-prophets', 'minor-prophets',
  'gospels', 'pauline-epistles', 'general-epistles', 'all-epistles',
  'book-selection',
];

export default function SinglePlayerPage() {
  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <header className="surface-card p-6 sm:p-8 mb-6">
          <p className="eyebrow mb-2">Single Player</p>
          <h1 className="headline-serif text-4xl sm:text-5xl mb-2">Choose a Mode</h1>
          <p className="content-muted">Pick a scripture pool and start a new run.</p>
        </header>

        <section className="mode-grid">
          {modeOrder.map(modeId => {
            const mode = gameModes[modeId];
            return (
              <article key={modeId} className="surface-card mode-card p-5 sm:p-6">
                <p className="eyebrow mb-2">Mode</p>
                <h2 className="headline-serif text-2xl mb-2">{mode.name}</h2>
                <p className="content-muted text-sm mb-5">{mode.description}</p>
                <Link href={`/play/${modeId}`} className="btn-primary block text-center py-2.5">Start Mode</Link>
              </article>
            );
          })}
        </section>

        <div className="pt-5">
          <Link href="/" className="btn-outline inline-block px-4 py-2.5">Back to Main Menu</Link>
        </div>
      </div>
    </main>
  );
}
