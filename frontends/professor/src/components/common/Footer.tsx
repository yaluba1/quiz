'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DynamicLogo } from './DynamicLogo';
import { useI18n } from '../../i18n/I18nProvider';

export function Footer() {
  const { t, locale } = useI18n();
  const pathname = usePathname();

  // Hide footer on live projector host screen to avoid clutter
  if (pathname?.includes('/host/')) {
    return null;
  }

  const prefix = `/${locale}`;

  return (
    <footer
      className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 transition-colors"
      data-testid="main-footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-1">
          <Link href={`${prefix}/dashboard`} className="flex items-center gap-2 group">
            <DynamicLogo className="h-[53.2px] w-auto transition-transform group-hover:scale-105" />
            <span className="font-bold text-base bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              {t('brand.name')}
            </span>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('brand.tagline')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6">
          <a
            href="https://github.com/yaluba1/quiz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
            aria-label={t('common.githubRepoAria')}
          >
            <img
              src="/teacher/GitHub_logo.svg"
              alt={t('common.githubLogoAlt')}
              className="w-5 h-5 dark:hidden transition-transform group-hover:scale-110"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/GitHub_logo.svg') || target.src.includes('/teacher/')) {
                  target.src = '/GitHub_logo.svg';
                }
              }}
            />
            <img
              src="/teacher/GitHub_logo_white.svg"
              alt={t('common.githubLogoAlt')}
              className="w-5 h-5 hidden dark:block transition-transform group-hover:scale-110"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.src.endsWith('/GitHub_logo_white.svg') || target.src.includes('/teacher/')) {
                  target.src = '/GitHub_logo_white.svg';
                }
              }}
            />
            <span>GitHub</span>
          </a>

          <a
            href="/"
            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {t('common.pupilGame')}
          </a>
        </div>
      </div>
    </footer>
  );
}

