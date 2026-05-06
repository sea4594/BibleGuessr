'use client';

import { themeOptions, useUiSettings } from '@/lib/uiSettingsContext';
import MainBottomNav from '@/components/MainBottomNav';

export default function ProfilePage() {
  const { settings, setTheme, setMode, setPreferredRounds } = useUiSettings();

  return (
    <main className="app-screen">
      <header className="topbar">
        <div className="font-semibold">Profile</div>
        <span className="content-muted text-sm">Display & Gameplay</span>
      </header>

      <div className="app-content app-content-scroll">
      <div className="page max-w-4xl">
        <section className="surface-card p-5">
          <p className="eyebrow mb-2">Profile</p>
          <h1 className="text-4xl sm:text-5xl font-bold mb-2">Preferences</h1>
          <p className="content-muted mb-6">Theme and gameplay defaults.</p>

          <h2 className="text-2xl font-semibold mb-3">Color Mode</h2>
          <div className="grid gap-2 mb-6">
            {(['dark', 'light'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                className={settings.mode === mode ? 'btn-primary w-full px-4 py-2.5 text-left' : 'btn-outline w-full px-4 py-2.5 text-left'}
              >
                {mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-semibold mb-3">Theme</h2>
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

          <h2 className="text-2xl font-semibold mb-3">Default Rounds</h2>
          <div className="grid gap-2 mb-2">
            {([5, 10] as const).map(n => (
              <button
                key={n}
                onClick={() => setPreferredRounds(n)}
                className={settings.preferredRounds === n ? 'btn-primary w-full px-4 py-2.5 text-left' : 'btn-outline w-full px-4 py-2.5 text-left'}
              >
                {n} rounds
              </button>
            ))}
          </div>
        </section>
      </div>
      </div>

      <MainBottomNav />
    </main>
  );
}