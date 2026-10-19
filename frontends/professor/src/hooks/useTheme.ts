'use client';

import { useState, useEffect, useCallback } from 'react';
import { QuizThemeConfig, DEFAULT_THEME } from '../types/theme';
import { applyThemeToDocument } from '../lib/theme-compiler';

export type ColorMode = 'light' | 'dark';

export function useTheme() {
  const [mode, setMode] = useState<ColorMode>('light');
  const [currentTheme, setCurrentTheme] = useState<QuizThemeConfig>(DEFAULT_THEME);

  // Initialize theme mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('quiz_theme_mode') as ColorMode | null;
    if (saved === 'dark' || saved === 'light') {
      setMode(saved);
      if (saved === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return;
    }

    // OS preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = prefersDark ? 'dark' : 'light';
    setMode(initial);
    if (prefersDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('quiz_theme_mode', next);
        document.cookie = `theme=${next}; path=/; max-age=31536000; SameSite=Lax`;
        if (next === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return next;
    });
  }, []);

  const applyCustomTheme = useCallback((theme: QuizThemeConfig) => {
    setCurrentTheme(theme);
    applyThemeToDocument(theme);
  }, []);

  return {
    mode,
    isDark: mode === 'dark',
    toggleMode,
    currentTheme,
    applyCustomTheme,
  };
}

