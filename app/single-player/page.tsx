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
          <h1 className="headline-serif text-3xl mb-1">Single Player</h1>

          <section className="menu-grid">
            <Link href="/single-player/whole-bible" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Whole Bible</h2>
              <p className="content-muted text-sm">Play across all 66 books.</p>
            </Link>

            <Link href="/single-player/sections" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Category</h2>
              <p className="content-muted text-sm">Choose a Bible section.</p>
            </Link>

            <Link href="/single-player/book" className="surface-card mode-card">
              <h2 className="headline-serif text-2xl mb-1">Book</h2>
              <p className="content-muted text-sm">Focus on one specific book.</p>
            </Link>
          </section>
        </div>
      </div>

      <MainBottomNav />
    </main>
  );
}
