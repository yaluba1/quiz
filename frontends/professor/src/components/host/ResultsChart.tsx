'use client';

import React from 'react';
import { Check, Triangle, Diamond, Circle, Square, Star, Hexagon, ArrowRight, Clock } from 'lucide-react';
import { QuestionResultHostPayload, QuestionActivePayload } from '../../types/socket';
import { useI18n } from '../../i18n/I18nProvider';

interface ResultsChartProps {
  question: QuestionActivePayload;
  resultData: QuestionResultHostPayload;
  onShowLeaderboard: () => void;
}

const OPTION_COLORS = [
  'bg-rose-500',
  'bg-blue-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-pink-500',
];

const OPTION_SHAPES = [Triangle, Diamond, Circle, Square, Star, Hexagon];

export function ResultsChart({ question, resultData, onShowLeaderboard }: ResultsChartProps) {
  const { t } = useI18n();

  const emptyVotes = resultData.emptyCount ?? resultData.distribution?.['__EMPTY__'] ?? 0;

  const maxVotes = Math.max(
    1,
    ...Object.values(resultData.distribution || {}),
    emptyVotes
  );

  return (
    <div
      className="min-h-[85vh] flex flex-col justify-between p-6 sm:p-10 max-w-7xl mx-auto space-y-8"
      data-testid="results-chart"
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {question.questionText}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {resultData.answeredCount} {t('host.responsesReceived')}
          </p>
        </div>

        <button
          type="button"
          onClick={onShowLeaderboard}
          className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
          data-testid="show-leaderboard-button"
        >
          <span>{t('host.showLeaderboard')}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Main Bar Distribution Chart */}
      <div className="my-auto grid grid-flow-col auto-cols-fr gap-4 sm:gap-6 items-end h-80 px-4">
        {question.options.map((opt, idx) => {
          const Shape = OPTION_SHAPES[idx % OPTION_SHAPES.length];
          const color = OPTION_COLORS[idx % OPTION_COLORS.length];
          const votes = resultData.distribution[opt.id] || 0;
          const heightPercent = Math.max(12, (votes / maxVotes) * 100);
          const isCorrect = opt.id === resultData.correctOptionId;

          return (
            <div
              key={opt.id}
              className="flex flex-col items-center h-full justify-end"
              data-testid={`result-bar-${idx}`}
            >
              {/* Vote count & correctness badge */}
              <div className="mb-2 text-center">
                {isCorrect && (
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500 text-white shadow-md mb-1 animate-bounce">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </span>
                )}
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {votes}
                </div>
              </div>

              {/* Bar Column */}
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full rounded-2xl ${color} shadow-lg transition-all duration-700 flex flex-col items-center justify-between p-3 relative ${
                  isCorrect ? 'ring-4 ring-emerald-400 ring-offset-2 dark:ring-offset-slate-900' : 'opacity-80'
                }`}
              >
                <div className="p-1.5 rounded-lg bg-black/20">
                  <Shape className="w-5 h-5 text-white fill-current" />
                </div>
              </div>

              {/* Option label beneath bar */}
              <div className="mt-3 text-center w-full">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate block">
                  {opt.optionText}
                </span>
              </div>
            </div>
          );
        })}

        {/* Empty / Unanswered Responses Bar */}
        <div
          className="flex flex-col items-center h-full justify-end"
          data-testid="result-bar-empty"
        >
          {/* Vote count */}
          <div className="mb-2 text-center">
            <div className="text-xl sm:text-2xl font-black text-slate-500 dark:text-slate-400 font-mono">
              {emptyVotes}
            </div>
          </div>

          {/* Bar Column */}
          <div
            style={{ height: `${Math.max(12, (emptyVotes / maxVotes) * 100)}%` }}
            className="w-full rounded-2xl bg-slate-400 dark:bg-slate-600 shadow-lg transition-all duration-700 flex flex-col items-center justify-between p-3 opacity-80"
          >
            <div className="p-1.5 rounded-lg bg-black/20 text-white">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Option label beneath bar */}
          <div className="mt-3 text-center w-full">
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 truncate block">
              {t('host.unanswered') || 'Unanswered'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

