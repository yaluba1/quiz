'use client';

import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';

export function ThemePreview() {
  const { t } = useI18n();

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('landing.themePreviewTitle')}
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-300 text-sm sm:text-base">
            {t('landing.themePreviewDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Light Theme Mockup Card */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">{t('common.themeLight')}</span>
              <div className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-[#93C572]" title="Pistachio #93C572" />
                <span className="w-4 h-4 rounded-full bg-[#FF7518]" title="Pumpkin #FF7518" />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">{t('landing.classSession')}</p>
                <p className="text-base font-bold text-slate-900">{t('landing.sampleSubject1')}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#93C572]/20 text-[#7EAC5F]">
                {t('landing.liveBadge')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#EF4444] text-white text-xs font-bold text-center">
                {t('landing.shapeTriangle')}
              </div>
              <div className="p-3 rounded-xl bg-[#3B82F6] text-white text-xs font-bold text-center">
                {t('landing.shapeDiamond')}
              </div>
              <div className="p-3 rounded-xl bg-[#F59E0B] text-white text-xs font-bold text-center">
                {t('landing.shapeCircle')}
              </div>
              <div className="p-3 rounded-xl bg-[#10B981] text-white text-xs font-bold text-center">
                {t('landing.shapeSquare')}
              </div>
            </div>
          </div>

          {/* Dark Theme Mockup Card */}
          <div className="p-6 rounded-3xl bg-[#0F172A] border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('common.themeDark')}</span>
              <div className="flex gap-2">
                <span className="w-4 h-4 rounded-full bg-[#93C572]" title="Pistachio #93C572" />
                <span className="w-4 h-4 rounded-full bg-[#FF7518]" title="Pumpkin #FF7518" />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#1E293B] border border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400">{t('landing.classSession')}</p>
                <p className="text-base font-bold text-white">{t('landing.sampleSubject2')}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FF7518]/20 text-[#FF7518]">
                {t('landing.liveBadge')}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[#EF4444] text-white text-xs font-bold text-center">
                {t('landing.shapeTriangle')}
              </div>
              <div className="p-3 rounded-xl bg-[#3B82F6] text-white text-xs font-bold text-center">
                {t('landing.shapeDiamond')}
              </div>
              <div className="p-3 rounded-xl bg-[#F59E0B] text-white text-xs font-bold text-center">
                {t('landing.shapeCircle')}
              </div>
              <div className="p-3 rounded-xl bg-[#10B981] text-white text-xs font-bold text-center">
                {t('landing.shapeSquare')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

