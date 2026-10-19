'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, CheckCircle, BarChart3 } from 'lucide-react';
import { PodiumEntry } from '../../types/socket';
import { useI18n } from '../../i18n/I18nProvider';

interface PodiumCeremonyProps {
  podium: PodiumEntry[];
  onEndSession: () => void;
}

export function PodiumCeremony({ podium, onEndSession }: PodiumCeremonyProps) {
  const { t } = useI18n();

  useEffect(() => {
    // Launch fireworks confetti
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });

      if (Date.now() < animationEnd) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const first = podium.find((p) => p.rank === 1);
  const second = podium.find((p) => p.rank === 2);
  const third = podium.find((p) => p.rank === 3);

  return (
    <div
      className="min-h-[85vh] flex flex-col justify-between p-6 sm:p-10 max-w-5xl mx-auto space-y-8"
      data-testid="podium-ceremony"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-500">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {t('host.podiumTitle')}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={onEndSession}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
          data-testid="finish-session-button"
        >
          <BarChart3 className="w-4 h-4" />
          <span>{t('host.endSession')}</span>
        </button>
      </div>

      {/* 3D-styled Podium Pillars */}
      <div className="my-auto grid grid-cols-3 gap-3 sm:gap-6 items-end pt-12">
        {/* 2nd Place (Silver) */}
        <div className="flex flex-col items-center" data-testid="podium-second">
          {second ? (
            <div className="text-center mb-3">
              <div className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[180px]">
                {second.nickname}
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {second.finalScore.toLocaleString()} {t('host.pts')}
              </div>
            </div>
          ) : (
            <div className="h-10" />
          )}

          <div className="w-full h-44 sm:h-56 rounded-t-3xl bg-gradient-to-t from-slate-400 to-slate-300 dark:from-slate-700 dark:to-slate-600 shadow-xl flex flex-col items-center justify-start p-4">
            <span className="text-3xl sm:text-5xl font-black text-white/90 font-mono">
              2
            </span>
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest mt-1">
              {t('host.secondPlace')}
            </span>
          </div>
        </div>

        {/* 1st Place (Gold - Tallest) */}
        <div className="flex flex-col items-center" data-testid="podium-first">
          {first ? (
            <div className="text-center mb-4">
              <div className="inline-flex p-2 rounded-full bg-amber-400 text-slate-900 shadow-lg mb-1 animate-bounce">
                <Trophy className="w-6 h-6 fill-current" />
              </div>
              <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white truncate max-w-[140px] sm:max-w-[200px]">
                {first.nickname}
              </div>
              <div className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400">
                {first.finalScore.toLocaleString()} {t('host.pts')}
              </div>
            </div>
          ) : (
            <div className="h-14" />
          )}

          <div className="w-full h-60 sm:h-72 rounded-t-3xl bg-gradient-to-t from-amber-500 to-amber-300 shadow-2xl flex flex-col items-center justify-start p-4">
            <span className="text-4xl sm:text-6xl font-black text-white font-mono">
              1
            </span>
            <span className="text-xs font-black text-white uppercase tracking-widest mt-1">
              {t('host.firstPlace')}
            </span>
          </div>
        </div>

        {/* 3rd Place (Bronze) */}
        <div className="flex flex-col items-center" data-testid="podium-third">
          {third ? (
            <div className="text-center mb-3">
              <div className="text-base sm:text-xl font-black text-slate-800 dark:text-slate-100 truncate max-w-[120px] sm:max-w-[180px]">
                {third.nickname}
              </div>
              <div className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                {third.finalScore.toLocaleString()} {t('host.pts')}
              </div>
            </div>
          ) : (
            <div className="h-10" />
          )}

          <div className="w-full h-32 sm:h-44 rounded-t-3xl bg-gradient-to-t from-amber-800 to-amber-600 shadow-xl flex flex-col items-center justify-start p-4">
            <span className="text-3xl sm:text-5xl font-black text-white/90 font-mono">
              3
            </span>
            <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest mt-1">
              {t('host.thirdPlace')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

