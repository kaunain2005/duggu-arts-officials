'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'pink';

export function useThemeMode() {
  const { setTheme, themes, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // This effect is required for next-themes to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = mounted ? (resolvedTheme as ThemeMode) : 'light';
  const availableThemes = themes as ThemeMode[];

  const toggleTheme = () => {
    if (currentTheme === 'light') setTheme('dark');
    else if (currentTheme === 'dark') setTheme('pink');
    else setTheme('light');
  };

  const setLight = () => setTheme('light');
  const setDark = () => setTheme('dark');
  const setPink = () => setTheme('pink');
  const setSystem = () => setTheme('system');

  return {
    theme: currentTheme,
    setTheme,
    themes: availableThemes,
    toggleTheme,
    setLight,
    setDark,
    setPink,
    setSystem,
    mounted,
    isLight: currentTheme === 'light',
    isDark: currentTheme === 'dark',
    isPink: currentTheme === 'pink',
  };
}

export function getThemeLabel(theme: ThemeMode): string {
  switch (theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    case 'pink':
      return 'Soft Pink';
    default:
      return 'System';
  }
}

export function getThemeIcon(theme: ThemeMode): string {
  switch (theme) {
    case 'light':
      return 'sun';
    case 'dark':
      return 'moon';
    case 'pink':
      return 'heart';
    default:
      return 'monitor';
  }
}
