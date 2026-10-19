'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles, School } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

export function HeroSection() {
  const router = useRouter();
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pin.trim().replace(/\D/g, '');
    if (cleanPin.length !== 6) {
      setPinError(t('errors.invalidPin'));
      return;
    }
    setPinError('');
    router.push(`/play?pin=${cleanPin}`);
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-pistachio/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-brand-pumpkin/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center relative z-10">
        {/* Open Source Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-pistachio/15 text-brand-pistachio-dark dark:text-brand-pistachio border border-brand-pistachio/30 mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5 text-brand-pumpkin" />
          <span>{t('landing.badge')}</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
          {t('landing.heroTitle')}<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-pistachio to-brand-pumpkin">
            {t('landing.heroHighlight')}
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="mt-5 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal">
          {t('landing.heroSubtitle')}
        </p>

        {/* Quick PIN Entry Card Embedded in Hero Fold */}
        <div className="mt-10 max-w-md mx-auto p-4 sm:p-6 rounded-3xl bg-white dark:bg-darkbg-card border-2 border-brand-pistachio/30 dark:border-darkbg-border shadow-2xl transition-all">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ''));
                  if (pinError) setPinError('');
                }}
                placeholder={t('landing.enterPinPlaceholder')}
                className="w-full text-center text-2xl sm:text-3xl font-mono font-bold tracking-widest px-4 py-4 rounded-2xl border-2 border-slate-200 dark:border-darkbg-border bg-slate-50 dark:bg-darkbg-primary text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-brand-pistachio focus:ring-4 focus:ring-brand-pistachio/20 transition-all"
                aria-label={t('game.pinLabel')}
              />
            </div>

            {pinError && (
              <p className="text-xs font-medium text-red-500 animate-shake">
                {pinError}
              </p>
            )}

            <button
              type="submit"
              className="w-full min-h-[58px] flex items-center justify-center gap-2 rounded-2xl bg-brand-pistachio hover:bg-brand-pistachio-dark text-white text-lg font-bold shadow-lg shadow-brand-pistachio/30 hover:shadow-brand-pistachio/40 active:scale-[0.98] transition-all"
            >
              <span>{t('landing.joinGame')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Educator CTA Divider */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-darkbg-border flex items-center justify-center">
            <a
              href="/teacher"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-pumpkin hover:text-brand-pumpkin-dark transition-colors"
            >
              <School className="w-4 h-4" />
              <span>{t('landing.teacherCta')}</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

