'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Copy, Edit3, Trash2, History, Tag, Folder } from 'lucide-react';
import { Quiz } from '../../types/quiz';
import { useI18n } from '../../i18n/I18nProvider';
import { formatDate } from '../../lib/utils';

interface QuizCardProps {
  quiz: Quiz;
  onHost: (quiz: Quiz) => void;
  onDuplicate: (quizId: string) => void;
  onDelete: (quizId: string) => void;
}

export function QuizCard({ quiz, onHost, onDuplicate, onDelete }: QuizCardProps) {
  const { t, locale } = useI18n();
  const prefix = `/${locale}`;

  return (
    <div
      className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
      data-testid={`quiz-card-${quiz.id}`}
    >
      <div>
        {/* Top Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {quiz.subject && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              {quiz.subject}
            </span>
          )}
          {quiz.level && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              {quiz.level}
            </span>
          )}
          {quiz.folder && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <Folder className="w-3.5 h-3.5" />
              <span>{quiz.folder}</span>
            </span>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
          {quiz.title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
          {quiz.description || t('dashboard.noDescription')}
        </p>

        {/* Tags */}
        {quiz.tags && quiz.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            {quiz.tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300"
              >
                <Tag className="w-2.5 h-2.5" />
                <span>{tag}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        {/* Metadata stats */}
        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-700/60 mb-4">
          <span>
            {quiz.playCount || 0} {t('dashboard.plays')}
          </span>
          <span>
            {t('dashboard.lastPlayed')}: {formatDate(quiz.updatedAt || quiz.createdAt)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onHost(quiz)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
            data-testid={`host-button-${quiz.id}`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{t('dashboard.playHost')}</span>
          </button>

          <Link
            href={`${prefix}/quizzes/${quiz.id}/edit`}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title={t('dashboard.edit')}
            data-testid={`edit-button-${quiz.id}`}
          >
            <Edit3 className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => onDuplicate(quiz.id)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title={t('dashboard.duplicate')}
            data-testid={`duplicate-button-${quiz.id}`}
          >
            <Copy className="w-4 h-4" />
          </button>

          <Link
            href={`${prefix}/sessions?quizId=${quiz.id}`}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
            title={t('dashboard.pastSessions')}
          >
            <History className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => onDelete(quiz.id)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 transition"
            title={t('dashboard.delete')}
            data-testid={`delete-button-${quiz.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

