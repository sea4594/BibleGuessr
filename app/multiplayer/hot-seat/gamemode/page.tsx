'use client';

import Link from 'next/link';
import AppTopBar from '@/components/AppTopBar';

export default function HotSeatGamemodePage() {
  return (
    <main className="app-screen">
      <AppTopBar title="Hot Seat" backHref="/multiplayer" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-3xl">
          <h1 className="headline-serif text-3xl mb-1">Hot Seat</h1>

          <section className="mode-grid">
            <Link href="/multiplayer/hot-seat/gamemode/whole-bible" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Whole Bible</h2>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/sections" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Category</h2>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/book" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Book</h2>
            </Link>

          </section>
        </div>
      </div>
    </main>
  );
}
