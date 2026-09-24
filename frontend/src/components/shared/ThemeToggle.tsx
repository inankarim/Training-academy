import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import clsx from 'clsx';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

interface ThemeToggleProps {
  /** StaffLayout's dark sidebar needs light-on-dark styling; LearnerLayout's white header needs the opposite. */
  variant?: 'light-chrome' | 'dark-chrome';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'light-chrome' }) => {
  const { theme, setTheme } = useTheme();
  // next-themes reads localStorage/system preference only after mount —
  // rendering the real state before then risks a light/dark mismatch flash.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isDarkChrome = variant === 'dark-chrome';

  return (
    <div
      className={clsx(
        'flex items-center gap-0.5 rounded-md border p-0.5',
        isDarkChrome ? 'border-white/10 bg-white/5' : 'border-surface-border bg-surface',
      )}
      role="radiogroup"
      aria-label="Theme"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const isActive = mounted && theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            title={label}
            onClick={() => setTheme(value)}
            className={clsx(
              'flex h-6 w-6 items-center justify-center rounded transition',
              isActive
                ? isDarkChrome
                  ? 'bg-white/15 text-white'
                  : 'bg-surface-card text-accent shadow-sm'
                : isDarkChrome
                ? 'text-white/50 hover:text-white/80'
                : 'text-ink-faint hover:text-ink-muted',
            )}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        );
      })}
    </div>
  );
};
