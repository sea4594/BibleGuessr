'use client';
import Link from 'next/link';
import { useUiSettings } from '@/lib/uiSettingsContext';

export default function HomePage() {
  const { settings } = useUiSettings();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-6xl mx-auto fade-up">
        <section className="surface-card hero-shell p-7 sm:p-9 lg:p-12 mb-7">
          <p className="eyebrow mb-3">Main Menu</p>
          <h1 className="headline-serif text-5xl sm:text-6xl leading-[0.95] mb-3">BibleGuessr</h1>
          <p className="content-muted max-w-2xl text-base sm:text-lg">
            Guess the book, chapter, and verse from a random KJV passage.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5 text-sm">
            <span className="surface-card-soft px-3 py-1.5">Theme: {settings.theme.replace('-', ' ')}</span>
            <span className="surface-card-soft px-3 py-1.5">Default rounds: {settings.preferredRounds}</span>
          </div>
        </section>

        <section className="menu-grid">
          <Link href="/single-player" className="surface-card menu-card">
            <p className="eyebrow">Play</p>
            <h2 className="headline-serif text-3xl mb-2">Single Player</h2>
            <p className="content-muted">Choose from all Bible mode pools and start a fast match.</p>
          </Link>

          <Link href="/multiplayer" className="surface-card menu-card">
            <p className="eyebrow">Party</p>
            <h2 className="headline-serif text-3xl mb-2">Multiplayer</h2>
            <p className="content-muted">Pass-and-play support with local score tracking and turn order.</p>
          </Link>

          <Link href="/settings" className="surface-card menu-card">
            <p className="eyebrow">Customize</p>
            <h2 className="headline-serif text-3xl mb-2">Settings</h2>
            <p className="content-muted">Switch themes and set your preferred round count.</p>
          </Link>

          <Link href="/play/full-bible" className="surface-card menu-card quick-start">
            <p className="eyebrow">Instant Start</p>
            <h2 className="headline-serif text-3xl mb-2">Quick Match</h2>
            <p className="content-muted">Jump into Full Bible mode immediately.</p>
          </Link>
        </section>
      </div>
    </main>
  );
}
