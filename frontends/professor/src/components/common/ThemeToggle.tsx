'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useI18n } from '../../i18n/I18nProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { isDark, toggleMode } = useTheme();
  const { t } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleMode}
      className={`p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${className}`}
      aria-label={t('common.toggleTheme')}
      data-testid="theme-toggle"
    >
      {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
    </button>
  );
}

