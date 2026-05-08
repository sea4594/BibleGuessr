'use client';

import Link from 'next/link';
import AppTopBar from '@/components/AppTopBar';

export default function HotSeatGamemodePage() {
  return (
    <main className="app-screen">
      <AppTopBar title="Hot Seat" backHref="/multiplayer" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-3xl">
          <h1 className="headline-serif text-3xl mb-2">Select Gamemode</h1>

          <section className="menu-grid">
            <Link href="/multiplayer/hot-seat/gamemode/whole-bible" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Whole Bible</h2>
              <p className="content-muted text-sm">All 66 books with your hot-seat settings.</p>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/sections" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Category</h2>
              <p className="content-muted text-sm">Pick from major Bible sections.</p>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/book" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Book</h2>
              <p className="content-muted text-sm">Focus on one specific book.</p>
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
