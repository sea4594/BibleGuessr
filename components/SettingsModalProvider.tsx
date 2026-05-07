'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { X, Settings } from 'lucide-react';
import { gameModes } from '@/lib/gameModes';
import { themeOptions, useUiSettings } from '@/lib/uiSettingsContext';
import HorizontalWheel from './HorizontalWheel';

const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown';

interface SettingsModalContextType {
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsModalContext = createContext<SettingsModalContextType | null>(null);

export function SettingsModalProvider({ children }: { children: React.ReactNode }) {
  const { settings, setPreferredGameMode, setPreferredRounds, setTheme } = useUiSettings();
  const [isOpen, setIsOpen] = useState(false);

  const modeOptions = useMemo(
    () =>
      Object.entries(gameModes)
        .filter(([, mode]) => !mode.isSingleBook)
        .map(([id, mode]) => ({ id, name: mode.name })),
    []
  );

  const openSettings = useCallback(() => setIsOpen(true), []);
  const closeSettings = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeSettings();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, closeSettings]);

  return (
    <SettingsModalContext.Provider value={{ openSettings, closeSettings }}>
      {children}

      {isOpen && (
        <div className="settings-overlay" onClick={closeSettings}>
          <div className="settings-modal surface-card" onClick={e => e.stopPropagation()}>
            <div className="settings-modal-header">
              <div>
                <div className="inline-flex items-center gap-2 font-semibold">
                  <Settings size={18} />
                  Settings
                </div>
                <p className="text-xs content-muted mt-0.5">Commit: {commitSha}</p>
              </div>
              <button onClick={closeSettings} className="btn-outline p-2" aria-label="Close settings">
                <X size={16} />
              </button>
            </div>

            <div className="settings-modal-body">
              <section className="surface-card-soft p-4">
                <p className="eyebrow mb-2">Theme</p>
                <div className="theme-grid">
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
              </section>

              <section className="surface-card-soft p-4">
                <p className="eyebrow mb-2">Defaults</p>
                <h3 className="text-base font-semibold mb-2">Default Mode</h3>
                <select
                  value={settings.preferredGameMode}
                  onChange={e => setPreferredGameMode(e.target.value)}
                  className="settings-input !w-full mb-4"
                >
                  {modeOptions.map(option => (
                    <option key={option.id} value={option.id}>
                      {option.name}
                    </option>
                  ))}
                </select>

                <h3 className="text-base font-semibold mb-2">Default Rounds</h3>
                <div className="mb-3">
                  <HorizontalWheel
                    label="Rounds"
                    values={[5, 10]}
                    selected={settings.preferredRounds}
                    onChange={value => setPreferredRounds(value as 5 | 10)}
                  />
                </div>

                <button
                  onClick={() => {
                    setPreferredGameMode('full-bible');
                    setPreferredRounds(5);
                    setTheme('ocean');
                  }}
                  className="btn-outline w-full py-2"
                >
                  Reset Defaults
                </button>
              </section>
            </div>
          </div>
        </div>
      )}
    </SettingsModalContext.Provider>
  );
}

export function useSettingsModal() {
  const context = useContext(SettingsModalContext);
  if (!context) {
    throw new Error('useSettingsModal must be used within SettingsModalProvider');
  }
  return context;
}
