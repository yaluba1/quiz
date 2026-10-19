'use client';

import React from 'react';
import { Check, Trash2, Square, Circle, Triangle, Diamond, Star, Hexagon } from 'lucide-react';
import { AnswerOption } from '../../types/quiz';
import { useI18n } from '../../i18n/I18nProvider';

interface AnswerOptionRowProps {
  option: AnswerOption;
  index: number;
  totalOptions: number;
  onChange: (updated: AnswerOption) => void;
  onRemove: () => void;
  isTrueFalse?: boolean;
}

const OPTION_COLORS = [
  'bg-rose-500 hover:bg-rose-600 text-white',
  'bg-blue-500 hover:bg-blue-600 text-white',
  'bg-amber-500 hover:bg-amber-600 text-white',
  'bg-emerald-500 hover:bg-emerald-600 text-white',
  'bg-purple-500 hover:bg-purple-600 text-white',
  'bg-pink-500 hover:bg-pink-600 text-white',
];

const OPTION_SHAPES = [Triangle, Diamond, Circle, Square, Star, Hexagon];

export function AnswerOptionRow({
  option,
  index,
  totalOptions,
  onChange,
  onRemove,
  isTrueFalse = false,
}: AnswerOptionRowProps) {
  const { t } = useI18n();
  const ShapeIcon = OPTION_SHAPES[index % OPTION_SHAPES.length];
  const colorClass = OPTION_COLORS[index % OPTION_COLORS.length];

  return (
    <div
      className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm"
      data-testid={`answer-option-row-${index}`}
    >
      {/* Shape badge */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass} shadow-sm`}
      >
        <ShapeIcon className="w-5 h-5 fill-current" />
      </div>

      {/* Option text */}
      <input
        type="text"
        value={option.optionText}
        onChange={(e) => onChange({ ...option, optionText: e.target.value })}
        disabled={isTrueFalse}
        placeholder={t('studio.optionPlaceholder', { num: index + 1 })}
        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition disabled:opacity-80"
        data-testid={`option-text-input-${index}`}
      />

      {/* Correct answer toggle */}
      <button
        type="button"
        onClick={() => onChange({ ...option, isCorrect: !option.isCorrect })}
        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
          option.isCorrect
            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/50'
            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
        }`}
        data-testid={`correct-toggle-${index}`}
      >
        <Check className={`w-3.5 h-3.5 ${option.isCorrect ? 'stroke-[3]' : 'opacity-40'}`} />
        <span>{t('studio.markCorrect')}</span>
      </button>

      {/* Remove option button (only for MCQ with > 2 options) */}
      {!isTrueFalse && totalOptions > 2 && (
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
          title={t('studio.removeOption')}
          data-testid={`remove-option-${index}`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

