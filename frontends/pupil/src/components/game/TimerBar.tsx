'use client';

import React, { useState, useEffect } from 'react';

interface TimerBarProps {
  timeLimitSeconds: number;
  onTimeExpired?: () => void;
  isPaused?: boolean;
}

export function TimerBar({
  timeLimitSeconds,
  onTimeExpired,
  isPaused = false,
}: TimerBarProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(timeLimitSeconds);

  useEffect(() => {
    setRemainingSeconds(timeLimitSeconds);
  }, [timeLimitSeconds]);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          onTimeExpired?.();
          return 0;
        }
        return Math.max(0, prev - 0.1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, onTimeExpired]);

  const percentage = Math.max(0, Math.min(100, (remainingSeconds / timeLimitSeconds) * 100));

  let barColor = 'bg-brand-pistachio';
  if (percentage <= 25) {
    barColor = 'bg-red-500';
  } else if (percentage <= 50) {
    barColor = 'bg-brand-pumpkin';
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
        <span>⏱ {Math.ceil(remainingSeconds)}s</span>
        <span>{Math.round(percentage)}%</span>
      </div>
      <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-100 ease-linear rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

