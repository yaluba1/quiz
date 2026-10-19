'use client';

import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';

interface LevelSelectorProps {
  levels: string[];
  selectedLevel: string | null;
  onSelectLevel: (level: string | null) => void;
}

export function LevelSelector({ levels, selectedLevel, onSelectLevel }: LevelSelectorProps) {
  const { t } = useI18n();

  return (
    <select
      value={selectedLevel || ''}
      onChange={(e) => onSelectLevel(e.target.value || null)}
      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
      data-testid="level-selector"
    >
      <option value="">{t('dashboard.allLevels')}</option>
      {levels.map((lvl) => (
        <option key={lvl} value={lvl}>
          {lvl}
        </option>
      ))}
    </select>
  );
}

