'use client';

import React from 'react';
import { QuestionMetric } from '../../types/session';
import { useI18n } from '../../i18n/I18nProvider';

interface QuestionAnalyticsTableProps {
  questions?: QuestionMetric[];
}

export function QuestionAnalyticsTable({ questions = [] }: QuestionAnalyticsTableProps) {
  const { t } = useI18n();
  const list = questions || [];

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm"
      data-testid="question-analytics-table"
    >
      <div className="p-5 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {t('analytics.questionBreakdown')}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-5 py-3.5 w-12 text-center">#</th>
              <th className="px-5 py-3.5">{t('analytics.question')}</th>
              <th className="px-5 py-3.5 text-center">{t('analytics.correctRate')}</th>
              <th className="px-5 py-3.5 text-center">{t('analytics.avgTime')}</th>
              <th className="px-5 py-3.5 text-center">{t('analytics.emptyCount') || 'Unanswered'}</th>
              <th className="px-5 py-3.5">{t('analytics.distractorBreakdown')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-slate-700 dark:text-slate-300">
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  {t('analytics.noQuestions') && t('analytics.noQuestions') !== 'analytics.noQuestions'
                    ? t('analytics.noQuestions')
                    : 'No question breakdown available'}
                </td>
              </tr>
            ) : (
              list.map((q, idx) => {
              const accuracyColor =
                q.correctPercentage >= 75
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                  : q.correctPercentage >= 50
                  ? 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40';

              const totalVotes = Math.max(1, q.totalAnswers);

              return (
                <tr key={q.questionId} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition">
                  <td className="px-5 py-4 text-center font-bold text-slate-400">
                    {idx + 1}
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white max-w-xs sm:max-w-md truncate">
                    {q.questionText}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full font-bold font-mono ${accuracyColor}`}>
                      {q.correctPercentage}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center font-mono font-medium">
                    {(q.averageResponseTimeMs / 1000).toFixed(1)}s
                  </td>
                  <td className="px-5 py-4 text-center font-mono font-medium" data-testid={`empty-count-${idx}`}>
                    {q.emptyCount ?? 0}
                  </td>
                  <td className="px-5 py-4">
                    {/* Small stacked option distribution indicator */}
                    <div className="flex items-center gap-1.5 min-w-[140px]">
                      {Object.entries(q.optionDistribution || {}).map(([optId, count], optIdx) => {
                        const widthPct = Math.round((count / totalVotes) * 100);
                        const colors = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500', 'bg-emerald-500'];
                        return (
                          <div
                            key={optId}
                            title={t('analytics.optionVoteTooltip', { option: String(optIdx + 1), count: String(count), percent: String(widthPct) })}
                            style={{ width: `${Math.max(15, widthPct)}%` }}
                            className={`h-5 rounded text-[10px] text-white font-bold flex items-center justify-center ${
                              colors[optIdx % colors.length]
                            }`}
                          >
                            {count}
                          </div>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

