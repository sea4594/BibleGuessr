'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { X, Settings } from 'lucide-react';
import { useAccountSync } from '@/lib/accountSync';
import { themePresets, useUiSettings } from '@/lib/uiSettingsContext';

const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA || 'unknown';

interface SettingsModalContextType {
  openSettings: () => void;
  closeSettings: () => void;
}

const SettingsModalContext = createContext<SettingsModalContextType | null>(null);

export function SettingsModalProvider({ children }: { children: React.ReactNode }) {
  const { settings, setThemePreset } = useUiSettings();
  const { firebaseEnabled, login, loginPending, logout, syncError, syncStatus, user } = useAccountSync();
  const [isOpen, setIsOpen] = useState(false);

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
              <section className="settings-section">
                <p className="eyebrow mb-2">Account</p>

                <div className="text-sm font-semibold mb-1">
                  {user ? (user.displayName || user.email || 'Signed in') : 'Not signed in'}
                </div>

                <p className="text-xs content-muted mb-3">
                  {!firebaseEnabled
                    ? 'Google sync is disabled until Firebase env vars are configured.'
                    : syncStatus === 'syncing'
                      ? 'Syncing your BibleGuessr data...'
                      : syncError
                        ? syncError
                        : user
                          ? 'Your profile, history, settings, and hot-seat config sync to this Google account.'
                          : 'Sign in with Google to sync everything across devices.'}
                </p>

                {user ? (
                  <button
                    onClick={() => {
                      void logout();
                    }}
                    className="btn-outline w-full py-2"
                    disabled={syncStatus === 'syncing'}
                  >
                    Logout
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      void login();
                    }}
                    className="btn-primary w-full py-2"
                    disabled={!firebaseEnabled || syncStatus === 'syncing' || loginPending}
                  >
                    {loginPending ? 'Opening Google...' : 'Google Login'}
                  </button>
                )}
              </section>

              <section className="settings-section">
                <p className="eyebrow mb-2">Theme</p>
                <select
                  value={settings.themePreset}
                  onChange={e => setThemePreset(e.target.value as typeof settings.themePreset)}
                  className="settings-input !w-full"
                >
                  {themePresets.map(preset => (
                    <option key={preset.id} value={preset.id}>{preset.name}</option>
                  ))}
                </select>
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
