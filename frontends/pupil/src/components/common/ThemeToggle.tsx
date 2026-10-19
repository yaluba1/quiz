'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n/I18nProvider';

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('common.themeLight') : t('common.themeDark')}
      className={`p-2 rounded-xl transition-colors duration-200 border ${
        isDark
          ? 'bg-darkbg-card border-darkbg-border text-yellow-400 hover:bg-slate-800'
          : 'bg-lightbg-card border-lightbg-border text-slate-700 hover:bg-slate-100'
      } ${className}`}
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

