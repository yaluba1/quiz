'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useI18n } from '../../i18n/I18nProvider';

interface CountdownScreenProps {
  initialSeconds?: number;
  onFinish?: () => void;
}

export function CountdownScreen({ initialSeconds = 5, onFinish }: CountdownScreenProps) {
  const { t } = useI18n();
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onFinish?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center">
      <motion.p
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg sm:text-xl font-bold uppercase tracking-widest text-brand-pumpkin mb-8"
      >
        {t('game.getReady')}
      </motion.p>

      <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center">
        {/* Animated background glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-pistachio/20 to-brand-pumpkin/20 blur-xl animate-pulse" />

        {/* Circular Progress Ring */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="50%"
            cy="50%"
            r="42%"
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth="8"
            fill="transparent"
          />
          <circle
            cx="50%"
            cy="50%"
            r="42%"
            className="stroke-brand-pistachio transition-all duration-1000 ease-linear"
            strokeWidth="8"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * seconds) / initialSeconds}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        <AnimatePresence mode="wait">
          <motion.div
            key={seconds}
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-6xl sm:text-7xl font-black text-slate-900 dark:text-white">
              {seconds}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
