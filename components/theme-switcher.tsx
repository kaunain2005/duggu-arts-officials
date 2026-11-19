'use client';

import { useThemeMode, getThemeLabel, getThemeIcon } from '@/lib/theme/theme-utils';
import { Sun, Moon, Heart, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils/formatting';

const iconMap = {
  sun: Sun,
  moon: Moon,
  heart: Heart,
  monitor: Monitor,
};

export function ThemeSwitcher() {
  const { theme, setTheme, themes, mounted } = useThemeMode();

  if (!mounted) {
    return (
      <div className="bg-muted/50 flex items-center gap-1 rounded-lg p-1">
        <div className="bg-muted h-8 w-8 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="bg-muted/50 flex items-center gap-1 rounded-lg p-1">
      {themes.map((t) => {
        const Icon = iconMap[getThemeIcon(t) as keyof typeof iconMap];
        const isActive = theme === t;
        return (
          <button
            key={t}
            onClick={() => setTheme(t)}
            className={cn(
              'relative flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200',
              'focus:ring-ring focus:outline-none focus:ring-2 focus:ring-offset-2',
              isActive
                ? 'bg-background text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            )}
            title={getThemeLabel(t)}
            aria-label={`Switch to ${getThemeLabel(t)} theme`}
            aria-pressed={isActive}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export function ThemeSelect() {
  const { theme, setTheme, mounted } = useThemeMode();

  if (!mounted) {
    return (
      <select
        className="bg-background border-input appearance-none rounded-md border px-3 py-2 text-sm"
        disabled
      >
        <option>Loading...</option>
      </select>
    );
  }

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'pink' | 'system')}
      className="bg-background border-input focus:ring-ring appearance-none rounded-md border px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2"
      aria-label="Select theme"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="pink">Soft Pink</option>
    </select>
  );
}
