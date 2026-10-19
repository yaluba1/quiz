'use client';

import React, { useState, useEffect } from 'react';
import { Triangle, Diamond, Circle, Square, Star, Hexagon, CheckCircle2, Music, Volume2 } from 'lucide-react';
import { QuestionActivePayload } from '../../types/socket';
import { inferMediaType } from '../../lib/media';
import { useI18n } from '../../i18n/I18nProvider';

interface QuestionDisplayProps {
  question: QuestionActivePayload;
  answeredCount: number;
  totalPlayers: number;
  onTimeUp?: () => void;
}

const OPTION_COLORS = [
  'bg-rose-500 text-white',
  'bg-blue-500 text-white',
  'bg-amber-500 text-white',
  'bg-emerald-500 text-white',
  'bg-purple-500 text-white',
  'bg-pink-500 text-white',
];

const OPTION_SHAPES = [Triangle, Diamond, Circle, Square, Star, Hexagon];

export function QuestionDisplay({
  question,
  answeredCount,
  totalPlayers,
  onTimeUp,
}: QuestionDisplayProps) {
  const { t } = useI18n();
  const [secondsLeft, setSecondsLeft] = useState(question.timeLimitSeconds);

  useEffect(() => {
    setSecondsLeft(question.timeLimitSeconds);
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (onTimeUp) onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [question, onTimeUp]);

  const progressPercent = (secondsLeft / question.timeLimitSeconds) * 100;

  return (
    <div
      className="min-h-[85vh] flex flex-col justify-between p-6 sm:p-10 max-w-7xl mx-auto space-y-6"
      data-testid="question-display"
    >
      {/* Top Bar: Question Index & Countdown Timer Ring */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="text-sm sm:text-base font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          {t('host.question')} {question.questionIndex + 1} / {question.totalQuestions}
        </div>

        {/* Circular Countdown Ring */}
        <div className="flex items-center gap-3">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                className="text-slate-200 dark:text-slate-700"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                className={`transition-all duration-1000 ${
                  secondsLeft <= 5 ? 'text-rose-500' : 'text-emerald-500'
                }`}
                strokeDasharray={163.36}
                strokeDashoffset={163.36 - (163.36 * progressPercent) / 100}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <span
              className={`absolute text-xl font-black font-mono ${
                secondsLeft <= 5 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'
              }`}
              data-testid="countdown-timer-value"
            >
              {secondsLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Main Question & Optional Media */}
      <div className="my-auto text-center space-y-6">
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
          {question.questionText}
        </h2>

        {question.mediaUrl && (() => {
          const type = question.mediaType || inferMediaType(question.mediaUrl);
          if (type === 'AUDIO') {
            return (
              <div
                className="flex flex-col items-center justify-center my-4 p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-800/50 shadow-sm max-w-xl mx-auto space-y-3"
                data-testid="host-media-audio"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-600 text-white shadow-md animate-pulse">
                    <Volume2 className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                      <Music className="w-4 h-4 text-purple-500" />
                      <span>{t('host.audioQuestionTitle')}</span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {t('host.audioQuestionPrompt')}
                    </div>
                  </div>
                </div>
                <audio
                  src={question.mediaUrl}
                  controls
                  autoPlay
                  className="w-full max-w-md rounded-xl"
                  data-testid="host-audio-player"
                />
              </div>
            );
          }
          if (type === 'VIDEO') {
            return (
              <div className="flex justify-center max-h-72 my-4" data-testid="host-media-video">
                <video
                  src={question.mediaUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-h-72 rounded-2xl object-contain shadow-md border border-slate-200 dark:border-slate-700 bg-black/5"
                  data-testid="host-video-player"
                />
              </div>
            );
          }
          return (
            <div className="flex justify-center max-h-72 my-4" data-testid="host-media-image">
              <img
                src={question.mediaUrl}
                alt={t('host.questionMediaAlt')}
                className="max-h-72 rounded-2xl object-contain shadow-md border border-slate-200 dark:border-slate-700"
                data-testid="host-image-element"
              />
            </div>
          );
        })()}

        {/* Real-time Answer Submissions Counter */}
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold border border-slate-200 dark:border-slate-700 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span data-testid="answer-stats">
            {answeredCount} / {totalPlayers} {t('host.answersReceived')}
          </span>
        </div>
      </div>

      {/* Answer Options Grid */}
      <div
        className={`grid gap-4 w-full ${
          question.options.length <= 2
            ? 'grid-cols-1 sm:grid-cols-2'
            : question.options.length <= 4
            ? 'grid-cols-1 sm:grid-cols-2'
            : 'grid-cols-1 sm:grid-cols-3'
        }`}
      >
        {question.options.map((opt, idx) => {
          const Shape = OPTION_SHAPES[idx % OPTION_SHAPES.length];
          const color = OPTION_COLORS[idx % OPTION_COLORS.length];

          return (
            <div
              key={opt.id}
              className={`p-6 rounded-2xl ${color} shadow-lg flex items-center gap-4 transition transform hover:scale-[1.01]`}
              data-testid={`option-card-${idx}`}
            >
              <div className="p-3 rounded-xl bg-black/20 flex items-center justify-center flex-shrink-0">
                <Shape className="w-7 h-7 fill-current" />
              </div>
              <span className="text-lg sm:text-xl font-bold flex-1">
                {opt.optionText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

