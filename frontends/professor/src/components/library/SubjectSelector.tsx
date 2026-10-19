'use client';

import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';

interface SubjectSelectorProps {
  subjects: string[];
  selectedSubject: string | null;
  onSelectSubject: (subject: string | null) => void;
}

export function SubjectSelector({ subjects, selectedSubject, onSelectSubject }: SubjectSelectorProps) {
  const { t } = useI18n();

  return (
    <select
      value={selectedSubject || ''}
      onChange={(e) => onSelectSubject(e.target.value || null)}
      className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
      data-testid="subject-selector"
    >
      <option value="">{t('dashboard.allSubjects')}</option>
      {subjects.map((sub) => (
        <option key={sub} value={sub}>
          {sub}
        </option>
      ))}
    </select>
  );
}

