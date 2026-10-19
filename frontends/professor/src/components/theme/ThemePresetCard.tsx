'use client';

import React from 'react';
import { QuizThemeConfig } from '../../types/theme';

interface ThemePresetCardProps {
  preset: QuizThemeConfig;
  isActive: boolean;
  onSelect: (preset: QuizThemeConfig) => void;
}

export function ThemePresetCard({ preset, isActive, onSelect }: ThemePresetCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(preset)}
      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between ${
        isActive
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30'
          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
      data-testid={`preset-card-${preset.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center -space-x-1.5">
          <span
            className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
            style={{ backgroundColor: preset.primaryColor }}
          />
          <span
            className="w-5 h-5 rounded-full border-2 border-white dark:border-slate-800 shadow-sm"
            style={{ backgroundColor: preset.secondaryColor }}
          />
        </div>
        <div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">
            {preset.name}
          </div>
          <div className="text-[10px] text-slate-400">
            {preset.fontFamily}
          </div>
        </div>
      </div>
    </button>
  );
}

