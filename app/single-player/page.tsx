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
            <h1 className="headline-serif text-3xl">Single Player</h1>
          </section>

          <section className="mode-grid">
            <Link href="/single-player/whole-bible" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Whole Bible</h2>
            </Link>

            <Link href="/single-player/sections" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Section Mode</h2>
            </Link>

            <Link href="/single-player/book" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Book Mode</h2>
            </Link>
          </section>
        </div>
      </div>

      <MainBottomNav />
    </main>
  );
}
