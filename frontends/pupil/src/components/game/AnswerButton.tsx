'use client';

import React from 'react';
import { useHaptics } from '../../hooks/useHaptics';
import { useI18n } from '../../i18n/I18nProvider';

interface AnswerButtonProps {
  id: string;
  colorShapeIndex: number; // 0: Red Triangle, 1: Blue Diamond, 2: Yellow Circle, 3: Green Square
  optionText?: string;
  isSelected?: boolean;
  isLocked?: boolean;
  disabled?: boolean;
  onClick: (id: string) => void;
}

const SHAPE_CONFIGS = [
  {
    bg: 'bg-red-500 hover:bg-red-600 border-red-600',
    text: 'text-white',
    shapeName: 'Triangle',
    svg: (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <polygon points="12 3 22 21 2 21" />
      </svg>
    ),
  },
  {
    bg: 'bg-blue-500 hover:bg-blue-600 border-blue-600',
    text: 'text-white',
    shapeName: 'Diamond',
    svg: (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <polygon points="12 2 22 12 12 22 2 12" />
      </svg>
    ),
  },
  {
    bg: 'bg-amber-500 hover:bg-amber-600 border-amber-600',
    text: 'text-white',
    shapeName: 'Circle',
    svg: (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
      </svg>
    ),
  },
  {
    bg: 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600',
    text: 'text-white',
    shapeName: 'Square',
    svg: (
      <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" />
      </svg>
    ),
  },
];

export function AnswerButton({
  id,
  colorShapeIndex,
  optionText,
  isSelected = false,
  isLocked = false,
  disabled = false,
  onClick,
}: AnswerButtonProps) {
  const { tap } = useHaptics();
  const index = Math.max(0, Math.min(3, colorShapeIndex % 4));
  const cfg = SHAPE_CONFIGS[index];

  const handleClick = () => {
    if (disabled || isLocked) return;
    tap();
    onClick(id);
  };

  let stateClasses = 'active:scale-95 shadow-lg';
  if (isLocked) {
    if (isSelected) {
      stateClasses = 'ring-4 ring-white ring-offset-4 ring-offset-slate-900 scale-100 opacity-100 brightness-110';
    } else {
      stateClasses = 'opacity-30 scale-95 grayscale';
    }
  }

  let t: ((key: string, params?: Record<string, string>) => string) | null = null;
  try {
    t = useI18n().t;
  } catch {
    // outside I18nProvider
  }

  const localizedShape = t ? t(`game.shapeName${cfg.shapeName}`) : cfg.shapeName;
  const ariaLabel = t
    ? (optionText
        ? t('game.optionShapeAria', { shape: localizedShape, text: optionText })
        : t('game.optionShapeOnlyAria', { shape: localizedShape }))
    : `Option ${cfg.shapeName}${optionText ? `: ${optionText}` : ''}`;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || isLocked}
      aria-label={ariaLabel}
      className={`w-full min-h-[72px] sm:min-h-[88px] p-4 rounded-2xl flex items-center justify-center gap-3 font-black text-lg transition-all duration-150 border-b-4 ${cfg.bg} ${cfg.text} ${stateClasses}`}
    >
      <span className="shrink-0 drop-shadow-md">{cfg.svg}</span>
      {optionText && (
        <span className="text-left text-base sm:text-lg font-bold leading-tight line-clamp-3">
          {optionText}
        </span>
      )}
    </button>
  );
}

