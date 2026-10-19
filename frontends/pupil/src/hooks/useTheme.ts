'use client';

import { useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    // 1. Check localStorage
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved === 'dark' || saved === 'light') {
      setTheme(saved);
      applyThemeClass(saved);
      return;
    }

    // 2. Browser default
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
      applyThemeClass('dark');
    } else {
      setTheme('light');
      applyThemeClass('light');
    }
  }, []);

  const applyThemeClass = (t: Theme) => {
    if (typeof document === 'undefined') return;
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    applyThemeClass(nextTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', nextTheme);
    }
  };

  return {
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme: (t: Theme) => {
      setTheme(t);
      applyThemeClass(t);
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', t);
      }
    },
  };
}

