'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { gameModes, GameModeId } from '@/lib/gameModes';
import { bibleData } from '@/lib/bibleData';

const modeOrder: GameModeId[] = [
  'full-bible', 'old-testament', 'new-testament', 'pentateuch',
  'historical', 'wisdom', 'major-prophets', 'minor-prophets',
  'gospels', 'pauline-epistles', 'general-epistles', 'all-epistles',
  'book-selection',
];

export default function SinglePlayerPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'ot' | 'nt'>('all');

  const filteredModeIds = useMemo(() => {
    return modeOrder.filter(modeId => {
      const mode = gameModes[modeId];
      const q = query.trim().toLowerCase();
      const matchesQuery =
        q.length === 0 ||
        mode.name.toLowerCase().includes(q) ||
        mode.description.toLowerCase().includes(q);

      if (!matchesQuery) return false;
      if (scope === 'all') return true;

      const otCount = mode.books.filter(book => {
        const idx = bibleData.findIndex(b => b.book === book.book);
        return idx >= 0 && idx <= 38;
      }).length;
      const ntCount = mode.books.length - otCount;
      if (scope === 'ot') return otCount > ntCount;
      return ntCount >= otCount;
    });
  }, [query, scope]);

  const handleSurprise = () => {
    if (filteredModeIds.length === 0) return;
    const randomIdx = Math.floor(Math.random() * filteredModeIds.length);
    router.push(`/play/${filteredModeIds[randomIdx]}`);
  };

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-6xl mx-auto">
        <header className="surface-card p-6 sm:p-8 mb-6">
          <p className="eyebrow mb-2">Single Player</p>
          <h1 className="headline-serif text-4xl sm:text-5xl mb-2">Choose a Mode</h1>
          <p className="content-muted">Pick a scripture pool and start a new run.</p>
        </header>

        <section className="surface-card-soft p-4 mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search modes..."
              className="settings-input !w-full"
            />
            <div className="flex gap-2">
              {[['all', 'All'], ['ot', 'Old Testament'], ['nt', 'New Testament']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setScope(key as 'all' | 'ot' | 'nt')}
                  className={scope === key ? 'btn-primary px-3 py-2 text-sm' : 'btn-outline px-3 py-2 text-sm'}
                >
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={handleSurprise}
              disabled={filteredModeIds.length === 0}
              className="btn-outline px-3 py-2 text-sm text-center whitespace-nowrap disabled:opacity-45"
            >
              Surprise Me
            </button>
          </div>
        </section>

        <section className="mode-grid">
          {filteredModeIds.map(modeId => {
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

        {filteredModeIds.length === 0 && (
          <p className="content-muted mt-4">No modes matched your search.</p>
        )}

        <div className="pt-5">
          <Link href="/" className="btn-outline inline-block px-4 py-2.5">Back to Main Menu</Link>
        </div>
      </div>
    </main>
  );
}
