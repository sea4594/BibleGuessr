'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useUiSettings } from '@/lib/uiSettingsContext';
import { GameStatsSummary, readGameHistory, summarizeGameHistory } from '@/lib/gameStats';

export default function HomePage() {
  const { settings } = useUiSettings();
  const [stats] = useState<GameStatsSummary>(() => {
    if (typeof window === 'undefined') {
      return {
        gamesPlayed: 0,
        bestScore: 0,
        averageAccuracy: 0,
        bestAccuracy: 0,
      };
    }
    return summarizeGameHistory(readGameHistory());
  });

  return (
    <main className="min-h-screen fade-up">
      <header className="topbar">
        <div className="font-extrabold tracking-wide">BibleGuessr</div>
        <div className="content-muted text-sm">Main Menu</div>
      </header>

      <div className="page">
        <section className="surface-card p-5 sm:p-6">
          <p className="eyebrow mb-3">Scripture Game</p>
          <h1 className="headline-serif text-4xl sm:text-5xl leading-[0.95] mb-3">Guess Verse Locations</h1>
          <p className="content-muted max-w-2xl text-base sm:text-lg">
            Find the book, chapter, and verse.
          </p>
          <div className="mt-4 flex flex-wrap gap-2.5 text-sm">
            <span className="surface-card-soft px-3 py-1.5">Theme: {settings.theme}</span>
            <span className="surface-card-soft px-3 py-1.5">Mode: {settings.mode}</span>
            <span className="surface-card-soft px-3 py-1.5">Default rounds: {settings.preferredRounds}</span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-4">
            <div className="surface-card-soft p-3">
              <p className="content-muted text-xs">Games Played</p>
              <p className="text-2xl font-bold">{stats.gamesPlayed}</p>
            </div>
            <div className="surface-card-soft p-3">
              <p className="content-muted text-xs">Best Score</p>
              <p className="text-2xl font-bold">{stats.bestScore}</p>
            </div>
            <div className="surface-card-soft p-3">
              <p className="content-muted text-xs">Avg Accuracy</p>
              <p className="text-2xl font-bold">{stats.averageAccuracy}%</p>
            </div>
            <div className="surface-card-soft p-3">
              <p className="content-muted text-xs">Best Accuracy</p>
              <p className="text-2xl font-bold">{stats.bestAccuracy}%</p>
            </div>
          </div>
        </section>

        <section className="menu-grid">
          <Link href="/single-player" className="surface-card menu-card">
            <p className="eyebrow">Play</p>
            <h2 className="headline-serif text-2xl mb-2">Single Player</h2>
            <p className="content-muted">Pick a mode and play.</p>
          </Link>

          <Link href="/multiplayer" className="surface-card menu-card">
            <p className="eyebrow">Party</p>
            <h2 className="headline-serif text-2xl mb-2">Multiplayer</h2>
            <p className="content-muted">Local pass-and-play.</p>
          </Link>

          <Link href="/settings" className="surface-card menu-card">
            <p className="eyebrow">Customize</p>
            <h2 className="headline-serif text-2xl mb-2">Settings</h2>
            <p className="content-muted">Theme and defaults.</p>
          </Link>

          <Link href="/play/full-bible" className="surface-card menu-card quick-start">
            <p className="eyebrow">Instant Start</p>
            <h2 className="headline-serif text-2xl mb-2">Quick Match</h2>
            <p className="content-muted">Start Full Bible now.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
