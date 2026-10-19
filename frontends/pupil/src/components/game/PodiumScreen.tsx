'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, Home, RotateCcw } from 'lucide-react';
import { PodiumEntry } from '../../types/game';
import { useI18n } from '../../i18n/I18nProvider';

interface PodiumScreenProps {
  podium: PodiumEntry[];
  currentPlayerId: string;
  onReset: () => void;
}

export function PodiumScreen({
  podium,
  currentPlayerId,
  onReset,
}: PodiumScreenProps) {
  const { t } = useI18n();

  useEffect(() => {
    try {
      const end = Date.now() + 3000;
      const interval: any = setInterval(() => {
        if (Date.now() > end) {
          return clearInterval(interval);
        }
        confetti({
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          colors: ['#93C572', '#FF7518', '#F59E0B', '#3B82F6'],
        });
      }, 250);
      return () => clearInterval(interval);
    } catch {
      // Ignore confetti errors
    }
  }, []);

  const playerPodium = podium.find((p) => p.playerId === currentPlayerId);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 sm:py-12 flex flex-col justify-center min-h-[calc(100vh-4rem)] text-center">
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-darkbg-card border-2 border-brand-pistachio/40 shadow-2xl">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500">
          <Trophy className="w-10 h-10 animate-bounce" />
        </div>

        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">
          {t('game.podiumTitle')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          {t('game.podiumSubtitle')}
        </p>

        {/* Podium Top 3 */}
        <div className="space-y-3 mb-8">
          {podium.slice(0, 3).map((entry) => {
            const isMe = entry.playerId === currentPlayerId;
            let medalColor = 'bg-slate-200 text-slate-700';
            if (entry.rank === 1) medalColor = 'bg-amber-400 text-amber-950 font-black';
            if (entry.rank === 2) medalColor = 'bg-slate-300 text-slate-900 font-black';
            if (entry.rank === 3) medalColor = 'bg-amber-700 text-amber-100 font-black';

            return (
              <div
                key={entry.playerId}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  isMe
                    ? 'border-brand-pistachio bg-brand-pistachio/15 font-bold'
                    : 'border-slate-200 dark:border-darkbg-border bg-slate-50 dark:bg-darkbg-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${medalColor}`}>
                    {entry.rank}
                  </span>
                  <span className="text-base text-slate-900 dark:text-white truncate max-w-[150px]">
                    {entry.nickname} {isMe && '⭐'}
                  </span>
                </div>
                <span className="text-sm font-black text-brand-pumpkin">
                  {entry.finalScore} {t('common.pointsAbbr')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Current Player Placement if not in Top 3 */}
        {playerPodium && playerPodium.rank > 3 && (
          <div className="p-4 rounded-2xl bg-brand-pistachio/10 border border-brand-pistachio mb-8">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
              {t('game.currentRank')}
            </p>
            <p className="text-2xl font-black text-brand-pistachio-dark dark:text-brand-pistachio">
              #{playerPodium.rank} • {playerPodium.finalScore} {t('common.pointsAbbr')}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 min-h-[52px] flex items-center justify-center gap-2 rounded-xl bg-brand-pistachio hover:bg-brand-pistachio-dark text-white font-bold text-sm shadow-md transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{t('game.playAgain')}</span>
          </button>
          <a
            href="/"
            className="flex-1 min-h-[52px] flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-darkbg-border text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-sm transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>{t('common.backHome')}</span>
          </a>
        </div>
      </div>
    </div>
  );
}

