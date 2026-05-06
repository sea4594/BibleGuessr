'use client';

import Link from 'next/link';
import AppTopBar from '@/components/AppTopBar';
import MainBottomNav from '@/components/MainBottomNav';

export default function SinglePlayerPage() {
  return (
    <main className="app-screen">
      <AppTopBar title="Single Player" />

      <div className="app-content app-content-scroll">
        <div className="page max-w-3xl">
          <section className="surface-card p-5">
            <p className="eyebrow mb-2">Mode Select</p>
            <h1 className="headline-serif text-3xl mb-2">Choose Play Mode</h1>
            <p className="content-muted">Pick a mode card to open setup.</p>
          </section>

          <section className="mode-grid">
            <Link href="/single-player/whole-bible" className="surface-card mode-card">
              <p className="eyebrow">Mode</p>
              <h2 className="headline-serif text-2xl mb-2">Whole Bible</h2>
              <p className="content-muted">All 66 books.</p>
            </Link>

            <Link href="/single-player/sections" className="surface-card mode-card">
              <p className="eyebrow">Mode</p>
              <h2 className="headline-serif text-2xl mb-2">Section Mode</h2>
              <p className="content-muted">OT, NT, and grouped sections.</p>
            </Link>

            <Link href="/single-player/book" className="surface-card mode-card">
              <p className="eyebrow">Mode</p>
              <h2 className="headline-serif text-2xl mb-2">Book Mode</h2>
              <p className="content-muted">Choose a specific book or Surprise me.</p>
            </Link>
          </section>
        </div>
      </div>

      <MainBottomNav />
    </main>
  );
}
