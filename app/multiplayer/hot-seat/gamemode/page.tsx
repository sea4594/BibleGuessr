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
            <p className="eyebrow mb-2">Gamemode Select</p>
            <h1 className="headline-serif text-3xl mb-2">Select Gamemode</h1>
            <p className="content-muted">Choose a mode to open setup and start.</p>
          </section>

          <section className="mode-grid">
            <Link href="/multiplayer/hot-seat/gamemode/whole-bible" className="surface-card mode-card">
              <p className="eyebrow">Mode</p>
              <h2 className="headline-serif text-2xl mb-2">Whole Bible</h2>
              <p className="content-muted">Classic all-book challenge.</p>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/sections" className="surface-card mode-card">
              <p className="eyebrow">Mode</p>
              <h2 className="headline-serif text-2xl mb-2">Section Mode</h2>
              <p className="content-muted">OT, NT, and grouped sections.</p>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/book" className="surface-card mode-card">
              <p className="eyebrow">Mode</p>
              <h2 className="headline-serif text-2xl mb-2">Book Mode</h2>
              <p className="content-muted">Choose a specific book.</p>
            </Link>

            <Link href="/multiplayer/hot-seat/gamemode/surprise" className="surface-card mode-card">
              <p className="eyebrow">Mode</p>
              <h2 className="headline-serif text-2xl mb-2">Surprise Me</h2>
              <p className="content-muted">Randomly chooses one mode and starts.</p>
            </Link>
          </section>
        </div>
      </div>
    </main>
  );
}
