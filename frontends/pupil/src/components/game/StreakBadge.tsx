'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  const { t } = useI18n();

  if (streak < 2) return null;

  return (
    <motion.div
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: [1.2, 1], opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-brand-pumpkin text-white shadow-lg shadow-brand-pumpkin/30"
    >
      <Flame className="w-5 h-5 animate-bounce fill-current" />
      <span className="text-sm font-black tracking-wide">
        {streak} {t('game.streakText')}
      </span>
    </motion.div>
  );
}

