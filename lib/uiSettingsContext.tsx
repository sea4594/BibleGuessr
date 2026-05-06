'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemeId = 'ocean' | 'forest' | 'clay' | 'berry' | 'bw';
export type ColorMode = 'dark' | 'light';

export interface UiSettings {
  theme: ThemeId;
  mode: ColorMode;
  preferredRounds: 5 | 10;
  preferredGameMode: string;
}

interface UiSettingsContextType {
  settings: UiSettings;
  setTheme: (theme: ThemeId) => void;
  setMode: (mode: ColorMode) => void;
  setPreferredRounds: (rounds: 5 | 10) => void;
  setPreferredGameMode: (mode: string) => void;
}

const STORAGE_KEY = 'bg-ui-settings-v1';

const DEFAULT_SETTINGS: UiSettings = {
  theme: 'ocean',
  mode: 'dark',
  preferredRounds: 5,
  preferredGameMode: 'full-bible',
};

const UiSettingsContext = createContext<UiSettingsContextType | null>(null);

export const themeOptions: Array<{ id: ThemeId; name: string; description: string }> = [
  { id: 'ocean', name: 'Ocean', description: 'Cool marine slate and mist tones' },
  { id: 'forest', name: 'Forest', description: 'Mossy greens with calm contrast' },
  { id: 'clay', name: 'Clay', description: 'Warm clay neutrals and sand accents' },
  { id: 'berry', name: 'Berry', description: 'Muted plum with soft pink contrast' },
  { id: 'bw', name: 'Black & White', description: 'High-contrast monochrome palette' },
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
        mode: parsed.mode ?? DEFAULT_SETTINGS.mode,
        preferredRounds: parsed.preferredRounds ?? DEFAULT_SETTINGS.preferredRounds,
        preferredGameMode: parsed.preferredGameMode ?? DEFAULT_SETTINGS.preferredGameMode,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
    document.documentElement.setAttribute('data-mode', 'dark');
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo<UiSettingsContextType>(
    () => ({
      settings,
      setTheme: (theme: ThemeId) => {
        setSettings(prev => ({ ...prev, theme }));
      },
      setMode: (mode: ColorMode) => {
        setSettings(prev => ({ ...prev, mode }));
      },
      setPreferredRounds: (preferredRounds: 5 | 10) => {
        setSettings(prev => ({ ...prev, preferredRounds }));
      },
      setPreferredGameMode: (preferredGameMode: string) => {
        setSettings(prev => ({ ...prev, preferredGameMode }));
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
