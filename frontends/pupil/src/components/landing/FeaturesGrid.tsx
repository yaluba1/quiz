'use client';

import React from 'react';
import { Smartphone, ShieldCheck, Palette } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

export function FeaturesGrid() {
  const { t } = useI18n();

  const features = [
    {
      icon: Smartphone,
      title: t('landing.feature1Title'),
      description: t('landing.feature1Desc'),
      color: 'text-brand-pistachio',
      bg: 'bg-brand-pistachio/15',
    },
    {
      icon: ShieldCheck,
      title: t('landing.feature2Title'),
      description: t('landing.feature2Desc'),
      color: 'text-brand-pumpkin',
      bg: 'bg-brand-pumpkin/15',
    },
    {
      icon: Palette,
      title: t('landing.feature3Title'),
      description: t('landing.feature3Desc'),
      color: 'text-blue-500',
      bg: 'bg-blue-500/15',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-50/50 dark:bg-darkbg-card/30 border-y border-slate-200/60 dark:border-darkbg-border/60">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            {t('landing.featuresTitle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-sm hover:shadow-md transition-all flex flex-col items-start"
              >
                <div className={`p-3 rounded-2xl ${feat.bg} ${feat.color} mb-5`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

