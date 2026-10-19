'use client';

import React, { useState } from 'react';
import { Play, X, Clock, Users, BookOpen } from 'lucide-react';
import { Quiz } from '../../types/quiz';
import { useI18n } from '../../i18n/I18nProvider';

interface HostSessionModalProps {
  quiz: Quiz | null;
  isOpen: boolean;
  onClose: () => void;
  onLaunch: (params: {
    quizId: string;
    title?: string;
    classGroup?: string;
    durationMinutes?: number;
    executionMode?: 'MANUAL' | 'AUTOMATIC';
  }) => void;
}

export function HostSessionModal({ quiz, isOpen, onClose, onLaunch }: HostSessionModalProps) {
  const { t } = useI18n();

  const [sessionTitle, setSessionTitle] = useState('');
  const [classGroup, setClassGroup] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [executionMode, setExecutionMode] = useState<'MANUAL' | 'AUTOMATIC'>('MANUAL');

  React.useEffect(() => {
    if (quiz?.defaultExecutionMode) {
      setExecutionMode(quiz.defaultExecutionMode);
    }
  }, [quiz]);

  if (!isOpen || !quiz) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLaunch({
      quizId: quiz.id,
      title: sessionTitle.trim() || undefined,
      classGroup: classGroup.trim() || undefined,
      durationMinutes: Number(durationMinutes) || 60,
      executionMode,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      data-testid="host-session-modal"
    >
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Play className="w-6 h-6 fill-current" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              {t('hostModal.title')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{quiz.title}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('hostModal.sessionName')}
            </label>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder={t('hostModal.sessionNamePlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              data-testid="session-name-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{t('hostModal.classCohort')}</span>
              </span>
            </label>
            <input
              type="text"
              value={classGroup}
              onChange={(e) => setClassGroup(e.target.value)}
              placeholder={t('hostModal.classCohortPlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              data-testid="class-cohort-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('hostModal.duration')}</span>
              </span>
            </label>
            <input
              type="number"
              min={5}
              max={240}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              data-testid="duration-input"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              {t('hostModal.executionMode') || 'Execution Mode'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setExecutionMode('MANUAL')}
                className={`p-3 rounded-xl border text-left transition ${
                  executionMode === 'MANUAL'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
                data-testid="mode-manual-btn"
              >
                <div className="text-xs font-bold">{t('hostModal.manualModeTitle') || 'Manual Mode'}</div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('hostModal.manualModeDesc') || 'Host controls when to advance questions'}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setExecutionMode('AUTOMATIC')}
                className={`p-3 rounded-xl border text-left transition ${
                  executionMode === 'AUTOMATIC'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
                data-testid="mode-automatic-btn"
              >
                <div className="text-xs font-bold">{t('hostModal.automaticModeTitle') || 'Automatic Mode'}</div>
                <div className="text-[11px] font-normal text-slate-500 dark:text-slate-400 mt-0.5">
                  {t('hostModal.automaticModeDesc') || 'Advances automatically on timer'}
                </div>
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
              data-testid="launch-session-button"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t('hostModal.launch')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

