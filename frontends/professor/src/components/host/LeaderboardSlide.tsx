'use client';

import React from 'react';
import { Trophy, ArrowRight, Flame } from 'lucide-react';
import { LeaderboardEntry } from '../../types/socket';
import { useI18n } from '../../i18n/I18nProvider';

interface LeaderboardSlideProps {
  leaderboard: LeaderboardEntry[];
  isFinalQuestion: boolean;
  onNext: () => void;
}

export function LeaderboardSlide({ leaderboard, isFinalQuestion, onNext }: LeaderboardSlideProps) {
  const { t } = useI18n();

  return (
    <div
      className="min-h-[85vh] flex flex-col justify-between p-6 sm:p-10 max-w-4xl mx-auto space-y-8"
      data-testid="leaderboard-slide"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('host.leaderboard')}
          </h3>
        </div>

        <button
          type="button"
          onClick={onNext}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
          data-testid="leaderboard-next-button"
        >
          <span>{isFinalQuestion ? t('host.showPodium') : t('host.nextQuestion')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Roster Ranking Ladder */}
      <div className="my-auto space-y-3">
        {leaderboard.slice(0, 5).map((player, index) => {
          const rankColors = [
            'bg-amber-500 text-white',
            'bg-slate-400 text-white',
            'bg-amber-700 text-white',
            'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
            'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
          ];

          return (
            <div
              key={player.playerId}
              className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md transition transform hover:scale-[1.01]"
              data-testid={`leaderboard-entry-${index}`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-sm ${
                    rankColors[index] || 'bg-slate-200 text-slate-800'
                  }`}
                >
                  {index + 1}
                </span>
                <span className="text-lg font-bold text-slate-900 dark:text-white">
                  {player.nickname}
                </span>
                {player.streak && player.streak >= 3 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                    <Flame className="w-3.5 h-3.5 fill-current" />
                    <span>{player.streak} {t('host.streakBadge')}</span>
                  </span>
                )}
              </div>

              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                {player.score.toLocaleString()} {t('host.pts')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

