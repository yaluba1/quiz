'use client';

import React from 'react';
import { QuizThemeConfig } from '../../types/theme';
import { DynamicLogo } from '../common/DynamicLogo';
import { useI18n } from '../../i18n/I18nProvider';

interface ThemeLivePreviewProps {
  theme: QuizThemeConfig;
}

export function ThemeLivePreview({ theme }: ThemeLivePreviewProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4" data-testid="theme-live-preview">
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {t('themeStudio.previewTitle')}
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Light Mode Preview */}
        <div
          className="rounded-2xl p-6 border border-slate-200 shadow-md flex flex-col justify-between"
          style={{
            backgroundColor: theme.backgroundColor || '#F7F9F6',
            fontFamily: theme.fontFamily || 'Inter, sans-serif',
          }}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-black/10">
              <DynamicLogo customLogoUrl={theme.logoUrl} className="h-7 w-auto" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {t('themeStudio.lightPreview')}
              </span>
            </div>

            <div className="my-6 text-center">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-extrabold text-white mb-2"
                style={{ backgroundColor: theme.primaryColor || '#93C572' }}
              >
                PIN: 839 201
              </span>
              <h5 className="text-base font-black text-slate-900">
                {t('themeStudio.sampleQuestion')}
              </h5>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              className="p-3 rounded-xl text-center text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: theme.primaryColor || '#93C572' }}
            >
              {t('themeStudio.optionA')}
            </div>
            <div
              className="p-3 rounded-xl text-center text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: theme.secondaryColor || '#FF7518' }}
            >
              {t('themeStudio.optionB')}
            </div>
          </div>
        </div>

        {/* Dark Mode Preview */}
        <div
          className="dark rounded-2xl p-6 border border-slate-700 bg-slate-900 shadow-md flex flex-col justify-between"
          style={{
            fontFamily: theme.fontFamily || 'Inter, sans-serif',
          }}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <DynamicLogo customLogoUrl={theme.logoUrl} className="h-7 w-auto" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {t('themeStudio.darkPreview')}
              </span>
            </div>

            <div className="my-6 text-center">
              <span
                className="inline-block px-3 py-1 rounded-full text-xs font-extrabold text-white mb-2"
                style={{ backgroundColor: theme.primaryColor || '#93C572' }}
              >
                PIN: 839 201
              </span>
              <h5 className="text-base font-black text-white">
                {t('themeStudio.sampleQuestion')}
              </h5>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              className="p-3 rounded-xl text-center text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: theme.primaryColor || '#93C572' }}
            >
              {t('themeStudio.optionA')}
            </div>
            <div
              className="p-3 rounded-xl text-center text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: theme.secondaryColor || '#FF7518' }}
            >
              {t('themeStudio.optionB')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

