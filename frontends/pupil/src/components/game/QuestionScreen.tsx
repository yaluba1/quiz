'use client';

import { Music, Volume2 } from 'lucide-react';
import { QuestionData } from '../../types/game';
import { inferMediaType } from '../../lib/media';
import { TimerBar } from './TimerBar';
import { AnswerButton } from './AnswerButton';
import { useI18n } from '../../i18n/I18nProvider';

interface QuestionScreenProps {
  question: QuestionData;
  selectedOptionId: string | null;
  isAnswerSubmitted: boolean;
  onSelectOption: (optionId: string) => void;
  onTimeExpired?: () => void;
}

export function QuestionScreen({
  question,
  selectedOptionId,
  isAnswerSubmitted,
  onSelectOption,
  onTimeExpired,
}: QuestionScreenProps) {
  const { t } = useI18n();

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-4 sm:py-6 flex flex-col justify-between min-h-[calc(100vh-4rem)]">
      {/* Top Header: Question Index & Timer Bar */}
      <div className="w-full mb-4 space-y-3">
        <div className="flex items-center justify-between text-sm font-bold text-slate-700 dark:text-slate-200">
          <span>
            {t('game.question')} {question.questionIndex + 1} {t('game.of')} {question.totalQuestions}
          </span>
          {isAnswerSubmitted && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-pistachio/20 text-brand-pistachio-dark dark:text-brand-pistachio animate-pulse">
              {t('game.answerLocked')}
            </span>
          )}
        </div>

        <TimerBar
          timeLimitSeconds={question.timeLimitSeconds}
          onTimeExpired={onTimeExpired}
          isPaused={isAnswerSubmitted}
        />
      </div>

      {/* Question presentation on device or prompt to look at host screen */}
      {question.showAnswersOnDevice ? (
        <div className="my-auto py-4 text-center">
          {question.mediaUrl && (() => {
            const type = question.mediaType || inferMediaType(question.mediaUrl);
            if (type === 'AUDIO') {
              return (
                <div
                  className="mb-4 p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex flex-col items-center justify-center space-y-2"
                  data-testid="pupil-media-audio"
                >
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-700 dark:text-purple-300">
                    <Music className="w-4 h-4" />
                    <span>{t('game.audioPrompt')}</span>
                  </div>
                  <audio
                    controls
                    src={question.mediaUrl}
                    className="w-full max-w-xs"
                    data-testid="pupil-audio-player"
                  />
                </div>
              );
            }
            if (type === 'VIDEO') {
              return (
                <div
                  className="mb-4 max-h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-darkbg-border flex justify-center bg-black/5"
                  data-testid="pupil-media-video"
                >
                  <video
                    controls
                    playsInline
                    src={question.mediaUrl}
                    className="max-h-48 object-contain"
                    data-testid="pupil-video-player"
                  />
                </div>
              );
            }
            return (
              <div
                className="mb-4 max-h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-darkbg-border flex justify-center"
                data-testid="pupil-media-image"
              >
                <img
                  src={question.mediaUrl}
                  alt={t('game.questionVisualAlt')}
                  className="max-h-48 object-contain"
                  data-testid="pupil-image-element"
                />
              </div>
            );
          })()}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
            {question.questionText}
          </h2>
        </div>
      ) : (
        <div className="my-auto py-8 text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-inner">
            <svg
              className="w-8 h-8 text-brand-pumpkin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="8" y1="21" x2="16" y2="21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="17" x2="12" y2="21" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-base sm:text-lg font-bold text-slate-700 dark:text-slate-200 max-w-xs">
            {t('game.lookAtHostScreen')}
          </p>
        </div>
      )}

      {/* Answer Choice Buttons: Thumb-Reachable 2x2 Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-auto pt-4">
        {question.options.map((opt, idx) => (
          <AnswerButton
            key={opt.id}
            id={opt.id}
            colorShapeIndex={opt.colorShapeIndex ?? idx}
            optionText={question.showAnswersOnDevice ? opt.optionText : undefined}
            isSelected={selectedOptionId === opt.id}
            isLocked={isAnswerSubmitted}
            onClick={onSelectOption}
          />
        ))}
      </div>

      {/* Bottom Lock-In Notice */}
      {isAnswerSubmitted && (
        <p className="mt-4 text-center text-xs font-semibold text-slate-500 dark:text-slate-400">
          {t('game.waitingOthers')}
        </p>
      )}
    </div>
  );
}

