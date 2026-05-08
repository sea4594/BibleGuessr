'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onSyncedLocalDataApplied, setSyncedLocalStorageItem } from './localDataState';

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
  preferredRounds: number;
  preferredGameMode: string;
  quickPlayTimerSeconds: number;
}

interface UiSettingsContextType {
  settings: UiSettings;
  setThemePreset: (themePreset: ThemePresetId) => void;
  setPreferredRounds: (rounds: number) => void;
  setPreferredGameMode: (mode: string) => void;
  setQuickPlayTimerSeconds: (seconds: number) => void;
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
  quickPlayTimerSeconds: 60,
};

function clampQuickPlayTimerSeconds(value: number) {
  const normalized = Number.isFinite(value) ? Math.round(value / 5) * 5 : DEFAULT_SETTINGS.quickPlayTimerSeconds;
  return Math.min(90, Math.max(5, normalized));
}

const UiSettingsContext = createContext<UiSettingsContextType | null>(null);

function readInitialSettings(): UiSettings {
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
      preferredRounds: Math.min(10, Math.max(1, parsed.preferredRounds ?? DEFAULT_SETTINGS.preferredRounds)),
      preferredGameMode: parsed.preferredGameMode ?? DEFAULT_SETTINGS.preferredGameMode,
      quickPlayTimerSeconds: clampQuickPlayTimerSeconds(
        parsed.quickPlayTimerSeconds ?? DEFAULT_SETTINGS.quickPlayTimerSeconds
      ),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function UiSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UiSettings>(() => readInitialSettings());

  useEffect(() => {
    return onSyncedLocalDataApplied(() => {
      setTimeout(() => {
        setSettings(readInitialSettings());
      }, 0);
    });
  }, []);

  useEffect(() => {
    const preset = themePresets.find(item => item.id === settings.themePreset) ?? themePresets[0];
    document.documentElement.setAttribute('data-theme', preset.color);
    document.documentElement.setAttribute('data-mode', preset.mode);
    setSyncedLocalStorageItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const value = useMemo<UiSettingsContextType>(
    () => ({
      settings,
      setThemePreset: (themePreset: ThemePresetId) => {
        setSettings(prev => ({ ...prev, themePreset }));
      },
      setPreferredRounds: (preferredRounds: number) => {
        const clamped = Math.min(10, Math.max(1, preferredRounds));
        setSettings(prev => ({ ...prev, preferredRounds: clamped }));
      },
      setPreferredGameMode: (preferredGameMode: string) => {
        setSettings(prev => ({ ...prev, preferredGameMode }));
      },
      setQuickPlayTimerSeconds: (quickPlayTimerSeconds: number) => {
        setSettings(prev => ({
          ...prev,
          quickPlayTimerSeconds: clampQuickPlayTimerSeconds(quickPlayTimerSeconds),
        }));
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
