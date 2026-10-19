'use client';

import React from 'react';
import { QuizThemeConfig } from '../../types/theme';
import { useI18n } from '../../i18n/I18nProvider';

interface ColorPalettePickerProps {
  theme: QuizThemeConfig;
  onChange: (updated: QuizThemeConfig) => void;
}

export function ColorPalettePicker({ theme, onChange }: ColorPalettePickerProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4" data-testid="color-palette-picker">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Primary Color */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            {t('themeStudio.primaryColor')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => onChange({ ...theme, primaryColor: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0"
              data-testid="primary-color-input"
            />
            <input
              type="text"
              value={theme.primaryColor}
              onChange={(e) => onChange({ ...theme, primaryColor: e.target.value })}
              placeholder="#93C572"
              className="w-28 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
            />
          </div>
        </div>

        {/* Secondary Color */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            {t('themeStudio.secondaryColor')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.secondaryColor}
              onChange={(e) => onChange({ ...theme, secondaryColor: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0"
              data-testid="secondary-color-input"
            />
            <input
              type="text"
              value={theme.secondaryColor}
              onChange={(e) => onChange({ ...theme, secondaryColor: e.target.value })}
              placeholder="#FF7518"
              className="w-28 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Background Color */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            {t('themeStudio.bgColor')}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={theme.backgroundColor}
              onChange={(e) => onChange({ ...theme, backgroundColor: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border-0 bg-transparent p-0"
              data-testid="bg-color-input"
            />
            <input
              type="text"
              value={theme.backgroundColor}
              onChange={(e) => onChange({ ...theme, backgroundColor: e.target.value })}
              placeholder="#F7F9F6"
              className="w-28 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
            />
          </div>
        </div>

        {/* Font Family */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
            {t('themeStudio.fontFamily')}
          </label>
          <select
            value={theme.fontFamily}
            onChange={(e) => onChange({ ...theme, fontFamily: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
            data-testid="font-family-select"
          >
            <option value="Inter">{t('themeStudio.fontInter')}</option>
            <option value="Poppins">{t('themeStudio.fontPoppins')}</option>
            <option value="Fredoka">{t('themeStudio.fontFredoka')}</option>
            <option value="Lexend">{t('themeStudio.fontLexend')}</option>
          </select>
        </div>
      </div>
    </div>
  );
}

