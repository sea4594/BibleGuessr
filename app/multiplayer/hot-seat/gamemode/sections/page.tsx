'use client';

import Link from 'next/link';
import AppTopBar from '@/components/AppTopBar';
import { gameModes, sectionModeIds } from '@/lib/gameModes';

export default function HotSeatSectionsPage() {
  return (
    <main className="app-screen">
      <AppTopBar title="Categories" backHref="/multiplayer/hot-seat/gamemode" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-4xl">
          <section className="surface-card p-5">
            <h1 className="headline-serif text-3xl mb-2">Category</h1>
            <p className="content-muted">Pick a category and start with Hot Seat settings.</p>
          </section>

          <section className="mode-grid">
            {sectionModeIds.map(modeId => (
              <Link
                key={modeId}
                href={`/multiplayer/hot-seat/gamemode/sections/${modeId}`}
                className="surface-card mode-card"
              >
                <p className="eyebrow">Category</p>
                <h2 className="headline-serif text-2xl mb-2">{gameModes[modeId].name}</h2>
                <p className="content-muted">{gameModes[modeId].description}</p>
              </Link>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
