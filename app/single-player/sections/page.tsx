'use client';

import Link from 'next/link';
import AppTopBar from '@/components/AppTopBar';
import { gameModes, sectionModeIds } from '@/lib/gameModes';

export default function SectionModeListPage() {
  return (
    <main className="app-screen">
      <AppTopBar title="Section Modes" backHref="/single-player" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-4xl">
          <section className="surface-card p-5">
            <p className="eyebrow mb-2">Section Mode</p>
            <h1 className="headline-serif text-3xl mb-2">Choose a Bible Section</h1>
            <p className="content-muted">Selecting one opens its setup page.</p>
          </section>

          <section className="mode-grid">
            {sectionModeIds.map(modeId => (
              <Link key={modeId} href={`/single-player/sections/${modeId}`} className="surface-card mode-card">
                <p className="eyebrow">Section</p>
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
