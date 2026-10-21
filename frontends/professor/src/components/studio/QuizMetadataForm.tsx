'use client';

import React from 'react';
import { Quiz } from '../../types/quiz';
import { QuizThemeConfig } from '../../types/theme';
import { useI18n } from '../../i18n/I18nProvider';

interface QuizMetadataFormProps {
  quiz: Partial<Quiz>;
  themes: QuizThemeConfig[];
  onChange: (updated: Partial<Quiz>) => void;
  onApplyTimeToAllQuestions?: (timeLimit: number) => void;
}

function parseTags(raw: string): string[] {
  return raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

export function QuizMetadataForm({ quiz, themes, onChange, onApplyTimeToAllQuestions }: QuizMetadataFormProps) {
  const { t } = useI18n();
  const [tagsText, setTagsText] = React.useState<string>(() => (quiz.tags ? quiz.tags.join(', ') : ''));

  React.useEffect(() => {
    const incomingTags = quiz.tags || [];
    setTagsText((prev) => {
      const currentParsed = parseTags(prev);
      if (incomingTags.join('\0') !== currentParsed.join('\0')) {
        return incomingTags.join(', ');
      }
      return prev;
    });
  }, [quiz.tags]);

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-4"
      data-testid="quiz-metadata-form"
    >
      <h3 className="text-lg font-black text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-700">
        {t('studio.quizSettings')}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Title */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('studio.title')} *
          </label>
          <input
            type="text"
            required
            value={quiz.title || ''}
            onChange={(e) => onChange({ ...quiz, title: e.target.value })}
            placeholder={t('studio.titlePlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            data-testid="quiz-title-input"
          />
        </div>

        {/* Description */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('studio.description')}
          </label>
          <textarea
            rows={2}
            value={quiz.description || ''}
            onChange={(e) => onChange({ ...quiz, description: e.target.value })}
            placeholder={t('studio.descriptionPlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            data-testid="quiz-description-input"
          />
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('studio.subject')}
          </label>
          <input
            type="text"
            value={quiz.subject || ''}
            onChange={(e) => onChange({ ...quiz, subject: e.target.value })}
            placeholder={t('studio.subjectPlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            data-testid="quiz-subject-input"
          />
        </div>

        {/* Academic Level */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('studio.level')}
          </label>
          <input
            type="text"
            value={quiz.level || ''}
            onChange={(e) => onChange({ ...quiz, level: e.target.value })}
            placeholder={t('studio.levelPlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            data-testid="quiz-level-input"
          />
        </div>

        {/* Folder */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('studio.folder')}
          </label>
          <input
            type="text"
            value={quiz.folder || ''}
            onChange={(e) => onChange({ ...quiz, folder: e.target.value })}
            placeholder={t('studio.folderPlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            data-testid="quiz-folder-input"
          />
        </div>

        {/* Assigned Theme */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('studio.theme')}
          </label>
          <select
            value={quiz.themeId || ''}
            onChange={(e) => onChange({ ...quiz, themeId: e.target.value || null })}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            data-testid="quiz-theme-select"
          >
            <option value="">{t('studio.defaultTheme')}</option>
            {themes.map((t) => (
              <option key={t.id || t.name} value={t.id || ''}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Default Question Time Limit */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('studio.defaultTimeLimit') || 'Default Question Time Limit'}
          </label>
          <div className="flex items-center gap-2">
            <select
              value={quiz.defaultQuestionTimeLimitSeconds ?? 20}
              onChange={(e) => onChange({ ...quiz, defaultQuestionTimeLimitSeconds: Number(e.target.value) })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              data-testid="quiz-default-time-limit-select"
            >
              {[5, 10, 20, 30, 60, 120].map((sec) => (
                <option key={sec} value={sec}>
                  {t('studio.secondsUnit', { count: sec })}
                </option>
              ))}
            </select>
            {onApplyTimeToAllQuestions && (
              <button
                type="button"
                onClick={() => onApplyTimeToAllQuestions(quiz.defaultQuestionTimeLimitSeconds ?? 20)}
                className="whitespace-nowrap px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold transition"
                title={t('studio.applyTimeToAll') || 'Apply to all questions'}
                data-testid="apply-time-to-all-button"
              >
                {t('studio.applyTimeToAll') || 'Apply to all'}
              </button>
            )}
          </div>
        </div>


        {/* Tags */}
        <div className="md:col-span-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
            {t('studio.tags')}
          </label>
          <input
            type="text"
            value={tagsText}
            onChange={(e) => {
              const raw = e.target.value;
              setTagsText(raw);
              onChange({ ...quiz, tags: parseTags(raw) });
            }}
            onBlur={() => {
              setTagsText(parseTags(tagsText).join(', '));
            }}
            placeholder={t('studio.tagsPlaceholder')}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
            data-testid="quiz-tags-input"
          />
        </div>
      </div>
    </div>
  );
}

