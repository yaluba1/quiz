'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { School } from 'lucide-react';
import { DynamicLogo } from '../common/DynamicLogo';
import { useI18n } from '../../i18n/I18nProvider';

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-slate-200 dark:border-darkbg-border bg-white dark:bg-darkbg-primary py-12 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center sm:items-start gap-2">
          <DynamicLogo width={160} height={40} className="h-[40px] sm:h-[43.6px] w-auto" />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('landing.platformDesc')}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6">
          <a
            href="https://github.com/yaluba1/quiz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-brand-pumpkin dark:hover:text-brand-pumpkin transition-colors group"
            aria-label={t('common.githubRepoAria')}
          >
            <Image
              src="/GitHub_logo.svg"
              alt={t('common.githubLogoAlt')}
              width={20}
              height={20}
              className="w-5 h-5 dark:hidden transition-transform group-hover:scale-110"
            />
            <Image
              src="/GitHub_logo_white.svg"
              alt={t('common.githubLogoAlt')}
              width={20}
              height={20}
              className="w-5 h-5 hidden dark:block transition-transform group-hover:scale-110"
            />
            <span>GitHub</span>
          </a>

          <a
            href="/teacher"
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-pumpkin hover:underline"
          >
            <School className="w-4 h-4" />
            <span>{t('landing.teacherCta')}</span>
          </a>
          <Link
            href="/play"
            className="text-sm font-semibold text-brand-pistachio-dark dark:text-brand-pistachio hover:underline"
          >
            {t('landing.joinGame')}
          </Link>
        </div>
      </div>
    </footer>
  );
}

