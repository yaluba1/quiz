'use client';

import React from 'react';
import { Sparkles, Radio } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

interface LobbyScreenProps {
  pin: string;
  nickname: string;
  quizTitle?: string;
}

export function LobbyScreen({ pin, nickname, quizTitle }: LobbyScreenProps) {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center items-center min-h-[calc(100vh-4rem)] text-center">
      {/* Session Title & PIN Badge */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-pistachio/15 text-brand-pistachio-dark dark:text-brand-pistachio border border-brand-pistachio/30 mb-3">
          PIN: {pin}
        </span>
        {quizTitle && (
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
            {quizTitle}
          </h1>
        )}
      </div>

      {/* Player Avatar Card */}
      <div className="w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkbg-card border-2 border-brand-pistachio/40 shadow-2xl relative overflow-hidden">
        {/* Decorative Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-pistachio to-brand-pumpkin" />

        {/* Animated Avatar Circle */}
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-tr from-brand-pistachio to-brand-pumpkin p-1 shadow-lg">
          <div className="w-full h-full rounded-full bg-white dark:bg-darkbg-primary flex items-center justify-center">
            <span className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-tr from-brand-pistachio to-brand-pumpkin uppercase">
              {nickname.charAt(0)}
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
          {nickname}
        </h2>

        <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{t('game.lobbyTitle')}</span>
        </div>

        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
          {t('game.lobbySubtitle')}
        </p>

        {/* Waiting Animation Indicator */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-darkbg-border flex items-center justify-center gap-2 text-xs font-medium text-slate-400">
          <Sparkles className="w-4 h-4 text-brand-pumpkin animate-spin" />
          <span>{t('game.waitingHost')}</span>
        </div>
      </div>
    </div>
  );
}

