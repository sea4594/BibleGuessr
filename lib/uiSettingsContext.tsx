'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeId = 'sunrise-paper' | 'sea-glass' | 'olive-clay' | 'midnight-study';

export interface UiSettings {
  theme: ThemeId;
  preferredRounds: 5 | 10;
}

interface UiSettingsContextType {
  settings: UiSettings;
  setTheme: (theme: ThemeId) => void;
  setPreferredRounds: (rounds: 5 | 10) => void;
}

const STORAGE_KEY = 'bg-ui-settings-v1';

const DEFAULT_SETTINGS: UiSettings = {
  theme: 'sunrise-paper',
  preferredRounds: 5,
};

const UiSettingsContext = createContext<UiSettingsContextType | null>(null);

export const themeOptions: Array<{ id: ThemeId; name: string; description: string }> = [
  { id: 'sunrise-paper', name: 'Sunrise Paper', description: 'Warm parchment with copper accents' },
  { id: 'sea-glass', name: 'Sea Glass', description: 'Cool mint and slate, high clarity' },
  { id: 'olive-clay', name: 'Olive Clay', description: 'Earthy neutrals with olive highlights' },
  { id: 'midnight-study', name: 'Midnight Study', description: 'Low-light dark mode for night play' },
];

export function UiSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UiSettings>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_SETTINGS;
    }

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return DEFAULT_SETTINGS;
      }

      const parsed = JSON.parse(raw) as Partial<UiSettings>;
      return {
        theme: parsed.theme ?? DEFAULT_SETTINGS.theme,
        preferredRounds: parsed.preferredRounds ?? DEFAULT_SETTINGS.preferredRounds,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo<UiSettingsContextType>(
    () => ({
      settings,
      setTheme: (theme: ThemeId) => {
        setSettings(prev => ({ ...prev, theme }));
      },
      setPreferredRounds: (preferredRounds: 5 | 10) => {
        setSettings(prev => ({ ...prev, preferredRounds }));
      },
    }),
    [settings]
  );

  return <UiSettingsContext.Provider value={value}>{children}</UiSettingsContext.Provider>;
}

export function useUiSettings() {
  const ctx = useContext(UiSettingsContext);
  if (!ctx) {
    throw new Error('useUiSettings must be used within UiSettingsProvider');
  }
  return ctx;
}
