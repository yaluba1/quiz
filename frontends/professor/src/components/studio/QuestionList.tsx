'use client';

import React from 'react';
import { ArrowUp, ArrowDown, Trash2, Plus, GripVertical } from 'lucide-react';
import { Question } from '../../types/quiz';
import { useI18n } from '../../i18n/I18nProvider';

interface QuestionListProps {
  questions: Question[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

export function QuestionList({
  questions,
  selectedIndex,
  onSelect,
  onAdd,
  onRemove,
  onMoveUp,
  onMoveDown,
}: QuestionListProps) {
  const { t } = useI18n();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {t('studio.questionsTitle', { count: questions.length })}
        </h4>
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          data-testid="sidebar-add-question"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t('studio.addQuestion')}</span>
        </button>
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {questions.map((q, idx) => (
          <div
            key={idx}
            className={`group flex items-center justify-between p-2.5 rounded-2xl border transition cursor-pointer ${
              idx === selectedIndex
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-sm'
                : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
            onClick={() => onSelect(idx)}
            data-testid={`question-item-${idx}`}
          >
            <div className="flex items-center gap-2 truncate">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                  idx === selectedIndex
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                {idx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                {q.questionText || t('studio.emptyQuestion')}
              </span>
            </div>

            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => onMoveUp(idx)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                title={t('studio.moveUp')}
                data-testid={`move-up-${idx}`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={idx === questions.length - 1}
                onClick={() => onMoveDown(idx)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                title={t('studio.moveDown')}
                data-testid={`move-down-${idx}`}
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemove(idx)}
                  className="p-1 rounded text-slate-400 hover:text-rose-600"
                  title={t('studio.deleteQuestion')}
                  data-testid={`delete-question-${idx}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

