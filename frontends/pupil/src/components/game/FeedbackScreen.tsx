'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { CheckCircle2, XCircle, Award } from 'lucide-react';
import { PupilFeedback } from '../../types/game';
import { StreakBadge } from './StreakBadge';
import { useI18n } from '../../i18n/I18nProvider';

interface FeedbackScreenProps {
  feedback: PupilFeedback;
}

const shakeVariants = {
  idle: { x: 0 },
  shake: {
    x: [-12, 12, -10, 10, -6, 6, -2, 2, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

export function FeedbackScreen({ feedback }: FeedbackScreenProps) {
  const { t } = useI18n();

  useEffect(() => {
    if (feedback.isCorrect) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#93C572', '#FF7518', '#F59E0B', '#10B981'],
        });
      } catch {
        // Silently catch canvas confetti errors in non-browser envs
      }
    }
  }, [feedback.isCorrect]);

  return (
    <div className="w-full max-w-md mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
      <motion.div
        variants={feedback.isCorrect ? undefined : shakeVariants}
        animate={feedback.isCorrect ? undefined : 'shake'}
        className={`w-full p-8 rounded-3xl border-2 shadow-2xl relative overflow-hidden transition-colors ${
          feedback.isCorrect
            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-100'
            : 'bg-red-500/10 border-red-500 text-red-950 dark:text-red-100'
        }`}
      >
        {/* Result Icon */}
        <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          {feedback.isCorrect ? (
            <CheckCircle2 className="w-20 h-20 text-emerald-500 drop-shadow-md animate-in zoom-in-75 duration-300" />
          ) : (
            <XCircle className="w-20 h-20 text-red-500 drop-shadow-md animate-in zoom-in-75 duration-300" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-black mb-3">
          {feedback.isCorrect
            ? t('game.correctTitle')
            : feedback.isEmpty
            ? (t('game.timeUpTitle') || "Time's Up!")
            : t('game.incorrectTitle')}
        </h2>

        {/* Points Earned Banner */}
        <div className="my-4">
          <span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-pistachio to-brand-pumpkin">
            +{feedback.pointsEarned}
          </span>
          <p className="text-xs uppercase font-bold text-slate-500 dark:text-slate-400 mt-1">
            {t('game.pointsEarned')}
          </p>
        </div>

        {/* Streak Badge */}
        {feedback.streak > 1 && (
          <div className="mt-3">
            <StreakBadge streak={feedback.streak} />
          </div>
        )}

        {/* Dynamic Rank Preview */}
        {feedback.rank && (
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-darkbg-border flex items-center justify-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
            <Award className="w-4 h-4 text-brand-pumpkin" />
            <span>
              {t('game.currentRank')}: #{feedback.rank}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

