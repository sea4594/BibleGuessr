'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ThemePresetId =
  | 'light'
  | 'dark'
  | 'clay'
  | 'ocean-light'
  | 'ocean-dark'
  | 'forest'
  | 'berry';

export type ThemeColor = 'bw' | 'ocean' | 'forest' | 'clay' | 'berry';
export type ColorMode = 'dark' | 'light';

export interface UiSettings {
  themePreset: ThemePresetId;
  preferredRounds: 5 | 10;
  preferredGameMode: string;
}

interface UiSettingsContextType {
  settings: UiSettings;
  setThemePreset: (themePreset: ThemePresetId) => void;
  setPreferredRounds: (rounds: 5 | 10) => void;
  setPreferredGameMode: (mode: string) => void;
}

const STORAGE_KEY = 'bg-ui-settings-v1';

export const themePresets: Array<{ id: ThemePresetId; name: string; mode: ColorMode; color: ThemeColor }> = [
  { id: 'light', name: 'Light', mode: 'light', color: 'bw' },
  { id: 'dark', name: 'Dark', mode: 'dark', color: 'bw' },
  { id: 'clay', name: 'Clay', mode: 'light', color: 'clay' },
  { id: 'ocean-light', name: 'Ocean (light)', mode: 'light', color: 'ocean' },
  { id: 'ocean-dark', name: 'Ocean (dark)', mode: 'dark', color: 'ocean' },
  { id: 'forest', name: 'Forest', mode: 'light', color: 'forest' },
  { id: 'berry', name: 'Berry', mode: 'light', color: 'berry' },
];

const DEFAULT_SETTINGS: UiSettings = {
  themePreset: 'ocean-light',
  preferredRounds: 5,
  preferredGameMode: 'full-bible',
};

const UiSettingsContext = createContext<UiSettingsContextType | null>(null);

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
        themePreset: parsed.themePreset ?? DEFAULT_SETTINGS.themePreset,
        preferredRounds: parsed.preferredRounds ?? DEFAULT_SETTINGS.preferredRounds,
        preferredGameMode: parsed.preferredGameMode ?? DEFAULT_SETTINGS.preferredGameMode,
      };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  useEffect(() => {
    const preset = themePresets.find(item => item.id === settings.themePreset) ?? themePresets[0];
    document.documentElement.setAttribute('data-theme', preset.color);
    document.documentElement.setAttribute('data-mode', preset.mode);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo<UiSettingsContextType>(
    () => ({
      settings,
      setThemePreset: (themePreset: ThemePresetId) => {
        setSettings(prev => ({ ...prev, themePreset }));
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
