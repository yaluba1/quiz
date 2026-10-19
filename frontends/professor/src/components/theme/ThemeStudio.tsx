'use client';

import React, { useState } from 'react';
import { Palette, CheckCircle, Save } from 'lucide-react';
import { QuizThemeConfig, DEFAULT_THEME } from '../../types/theme';
import { ColorPalettePicker } from './ColorPalettePicker';
import { LogoUploader } from './LogoUploader';
import { ThemeLivePreview } from './ThemeLivePreview';
import { ThemePresetCard } from './ThemePresetCard';
import { useI18n } from '../../i18n/I18nProvider';

const PRESETS: QuizThemeConfig[] = [
  {
    name: 'Classic School',
    isSystemPreset: true,
    primaryColor: '#93C572',
    secondaryColor: '#FF7518',
    backgroundColor: '#F7F9F6',
    fontFamily: 'Inter',
  },
  {
    name: 'Cyber Neon',
    isSystemPreset: true,
    primaryColor: '#06B6D4',
    secondaryColor: '#EC4899',
    backgroundColor: '#0F172A',
    fontFamily: 'Poppins',
  },
  {
    name: 'Pastel Morning',
    isSystemPreset: true,
    primaryColor: '#A78BFA',
    secondaryColor: '#F472B6',
    backgroundColor: '#FAF5FF',
    fontFamily: 'Fredoka',
  },
];

interface ThemeStudioProps {
  initialTheme?: QuizThemeConfig;
  onSave?: (theme: QuizThemeConfig) => Promise<void> | void;
}

export function ThemeStudio({ initialTheme = DEFAULT_THEME, onSave }: ThemeStudioProps) {
  const { t } = useI18n();
  const [theme, setTheme] = useState<QuizThemeConfig>(initialTheme);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSelectPreset = (preset: QuizThemeConfig) => {
    setTheme((prev) => ({
      ...prev,
      ...preset,
      name: `${preset.name} (Custom)`,
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    setSavedSuccess(false);
    try {
      await onSave(theme);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8" data-testid="theme-studio">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Palette className="w-6 h-6 text-emerald-500" />
            <span>{t('themeStudio.title')}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {t('themeStudio.subtitle')}
          </p>
        </div>

        {onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 disabled:opacity-50"
            data-testid="save-theme-button"
          >
            {savedSuccess ? (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{t('themeStudio.saved')}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('themeStudio.saveTheme')}</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Preset Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('themeStudio.presets')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <ThemePresetCard
              key={p.name}
              preset={p}
              isActive={theme.name.startsWith(p.name)}
              onSelect={handleSelectPreset}
            />
          ))}
        </div>
      </div>

      {/* Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <ColorPalettePicker theme={theme} onChange={setTheme} />
          <LogoUploader logoUrl={theme.logoUrl} onChange={(logoUrl) => setTheme({ ...theme, logoUrl })} />
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <ThemeLivePreview theme={theme} />
        </div>
      </div>
    </div>
  );
}

