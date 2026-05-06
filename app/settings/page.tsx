'use client';
import Link from 'next/link';
import { themeOptions, useUiSettings } from '@/lib/uiSettingsContext';

export default function SettingsPage() {
  const { settings, setTheme, setPreferredRounds } = useUiSettings();

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12">
      <div className="max-w-4xl mx-auto">
        <section className="surface-card p-6 sm:p-8">
          <p className="eyebrow mb-2">Settings</p>
          <h1 className="headline-serif text-4xl sm:text-5xl mb-3">Game Preferences</h1>
          <p className="content-muted mb-6">Choose a curated look and your default rounds.</p>

          <h2 className="headline-serif text-2xl mb-3">Theme</h2>
          <div className="theme-grid mb-6">
            {themeOptions.map(theme => (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={`theme-option ${settings.theme === theme.id ? 'active' : ''}`}
              >
                <span className="theme-name">{theme.name}</span>
                <span className="theme-description">{theme.description}</span>
              </button>
            ))}
          </div>

          <h2 className="headline-serif text-2xl mb-3">Default Rounds</h2>
          <div className="flex gap-3 mb-6">
            {[5, 10].map(n => (
              <button
                key={n}
                onClick={() => setPreferredRounds(n as 5 | 10)}
                className={settings.preferredRounds === n ? 'btn-primary px-4 py-2.5' : 'btn-outline px-4 py-2.5'}
              >
                {n} rounds
              </button>
            ))}
          </div>

          <Link href="/" className="btn-outline inline-block px-4 py-2.5">Back to Main Menu</Link>
        </section>
      </div>
    </main>
  );
}
