import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'hush-theme';
const THEME_CHANGE_EVENT = 'hush-theme-change';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // LocalStorage blocked, restricted, or disabled
  }
  return 'dark';
}

function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // LocalStorage blocked, quota exceeded, or restricted
  }
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);

  // Apply attributes immediately on mount and theme update
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Sync across multiple components and tabs
  useEffect(() => {
    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<Theme>;
      if (customEvent.detail && (customEvent.detail === 'dark' || customEvent.detail === 'light')) {
        setThemeState(customEvent.detail);
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'dark' || e.newValue === 'light')) {
        setThemeState(e.newValue);
      }
    };

    window.addEventListener(THEME_CHANGE_EVENT, handleCustomChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(THEME_CHANGE_EVENT, handleCustomChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    applyTheme(newTheme);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: newTheme }));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((curr) => {
      const next: Theme = curr === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent<Theme>(THEME_CHANGE_EVENT, { detail: next }));
      }
      return next;
    });
  }, []);

  return { theme, toggleTheme, setTheme };
}

export default useTheme;
