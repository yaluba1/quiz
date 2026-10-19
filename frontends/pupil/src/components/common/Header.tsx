'use client';

import React from 'react';
import Link from 'next/link';
import { Volume2, VolumeX } from 'lucide-react';
import { DynamicLogo } from './DynamicLogo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { useSoundEffects } from '../../hooks/useSoundEffects';
import { useI18n } from '../../i18n/I18nProvider';

interface HeaderProps {
  logoUrl?: string | null;
  showBackToHome?: boolean;
}

export function Header({ logoUrl, showBackToHome = false }: HeaderProps) {
  const { isMuted, toggleMute } = useSoundEffects();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/70 dark:bg-darkbg-primary/70 border-b border-slate-200/80 dark:border-darkbg-border/80 transition-colors">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group focus:outline-none">
            <DynamicLogo logoUrl={logoUrl} width={187} height={48} className="h-[53.2px] w-auto" priority />
          </Link>
          {showBackToHome && (
            <Link
              href="/"
              className="text-xs font-medium text-slate-500 hover:text-brand-pumpkin transition-colors ml-2 hidden sm:inline-block"
            >
              ← {t('common.backHome')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? t('common.soundOff') : t('common.soundOn')}
            className="p-2 rounded-xl border border-slate-200 dark:border-darkbg-border bg-white dark:bg-darkbg-card text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-brand-pistachio" />}
          </button>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Language Selector */}
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
}

