'use client';

import Link from 'next/link';
import AppTopBar from '@/components/AppTopBar';

export default function HotSeatGamemodePage() {
  return (
    <main className="app-screen">
      <AppTopBar title="Hot Seat Gamemode" backHref="/multiplayer" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-3xl">
          <section className="surface-card p-5">
            <h1 className="headline-serif text-3xl">Select Gamemode</h1>
          </section>

          <section className="mode-grid">
            <Link href="/multiplayer/hot-seat/gamemode/whole-bible" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Whole Bible</h2>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/sections" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Section Mode</h2>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/book" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Book Mode</h2>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/surprise" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Surprise Me</h2>
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
