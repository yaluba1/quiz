'use client';

import React from 'react';
import { Clock, Award, Smartphone, Monitor, Plus, AlertCircle } from 'lucide-react';
import { Question, AnswerOption, QuestionType } from '../../types/quiz';
import { AnswerOptionRow } from './AnswerOptionRow';
import { MediaUploader } from './MediaUploader';
import { VALID_TIME_LIMITS, VALID_POINTS_MULTIPLIERS, validateQuestion } from '../../lib/validation';
import { useI18n } from '../../i18n/I18nProvider';

interface QuestionEditorProps {
  question: Question;
  questionNumber: number;
  onChange: (updated: Question) => void;
}

export function QuestionEditor({ question, questionNumber, onChange }: QuestionEditorProps) {
  const { t } = useI18n();

  const handleTypeChange = (type: QuestionType) => {
    if (type === 'TRUE_FALSE') {
      onChange({
        ...question,
        questionType: 'TRUE_FALSE',
        answerOptions: [
          { orderIndex: 0, optionText: t('studio.true'), isCorrect: true, colorShapeIndex: 0 },
          { orderIndex: 1, optionText: t('studio.false'), isCorrect: false, colorShapeIndex: 1 },
        ],
      });
    } else {
      onChange({
        ...question,
        questionType: 'MULTIPLE_CHOICE',
        answerOptions: [
          { orderIndex: 0, optionText: '', isCorrect: true, colorShapeIndex: 0 },
          { orderIndex: 1, optionText: '', isCorrect: false, colorShapeIndex: 1 },
          { orderIndex: 2, optionText: '', isCorrect: false, colorShapeIndex: 2 },
          { orderIndex: 3, optionText: '', isCorrect: false, colorShapeIndex: 3 },
        ],
      });
    }
  };

  const handleAddOption = () => {
    if (question.answerOptions.length >= 6) return;
    const nextIndex = question.answerOptions.length;
    onChange({
      ...question,
      answerOptions: [
        ...question.answerOptions,
        {
          orderIndex: nextIndex,
          optionText: '',
          isCorrect: false,
          colorShapeIndex: nextIndex,
        },
      ],
    });
  };

  const handleUpdateOption = (index: number, updated: AnswerOption) => {
    const newOptions = [...question.answerOptions];
    newOptions[index] = updated;
    onChange({ ...question, answerOptions: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    if (question.answerOptions.length <= 2) return;
    const filtered = question.answerOptions.filter((_, idx) => idx !== index);
    const reindexed = filtered.map((opt, idx) => ({ ...opt, orderIndex: idx, colorShapeIndex: idx }));
    onChange({ ...question, answerOptions: reindexed });
  };

  const validationErrors = validateQuestion(question);

  return (
    <div
      className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm space-y-6"
      data-testid="question-editor"
    >
      {/* Header with question number and type selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          {t('studio.questionNum', { num: questionNumber })}
        </h3>

        {/* Question Type Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => handleTypeChange('MULTIPLE_CHOICE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              question.questionType === 'MULTIPLE_CHOICE'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            data-testid="type-multiple-choice"
          >
            {t('studio.multipleChoice')}
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('TRUE_FALSE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              question.questionType === 'TRUE_FALSE'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            data-testid="type-true-false"
          >
            {t('studio.trueFalse')}
          </button>
        </div>
      </div>

      {/* Question Text Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
          {t('studio.questionText')}
        </label>
        <textarea
          rows={2}
          value={question.questionText}
          onChange={(e) => onChange({ ...question, questionText: e.target.value })}
          placeholder={t('studio.questionPlaceholder')}
          className="w-full px-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-base font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition"
          data-testid="question-text-input"
        />
      </div>

      {/* Time Limit & Points Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Time Limit */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('studio.timeLimit')}</span>
          </label>
          <select
            value={question.timeLimitSeconds}
            onChange={(e) => onChange({ ...question, timeLimitSeconds: Number(e.target.value) })}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition"
            data-testid="time-limit-select"
          >
            {VALID_TIME_LIMITS.map((sec) => (
              <option key={sec} value={sec}>
                {t('studio.secondsUnit', { count: sec })}
              </option>
            ))}
          </select>
        </div>

        {/* Scoring Points Multiplier */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('studio.points')}</span>
          </label>
          <select
            value={question.pointsMultiplier}
            onChange={(e) => onChange({ ...question, pointsMultiplier: e.target.value })}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 outline-none transition"
            data-testid="points-select"
          >
            <option value="1.00">{t('studio.standardPoints')}</option>
            <option value="2.00">{t('studio.doublePoints')}</option>
            <option value="0.00">{t('studio.noPoints')}</option>
          </select>
        </div>
      </div>

      {/* Multimedia Uploader (Images, Audio, Video) */}
      <MediaUploader
        mediaUrl={question.mediaUrl}
        mediaType={question.mediaType}
        onChange={(url, type) => onChange({ ...question, mediaUrl: url, mediaType: type })}
      />

      {/* Projector-Only Mode Toggle */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          {question.showAnswersOnDevice ? (
            <Smartphone className="w-5 h-5 text-emerald-500" />
          ) : (
            <Monitor className="w-5 h-5 text-amber-500" />
          )}
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white">
              {question.showAnswersOnDevice ? t('studio.showOnDevice') : t('studio.projectorOnly')}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {question.showAnswersOnDevice
                ? t('studio.showOnDeviceDesc')
                : t('studio.projectorOnlyDesc')}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onChange({ ...question, showAnswersOnDevice: !question.showAnswersOnDevice })}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            question.showAnswersOnDevice ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
          data-testid="show-on-device-toggle"
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              question.showAnswersOnDevice ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Answer Options Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t('studio.answerOptions')}
          </label>
          {question.questionType === 'MULTIPLE_CHOICE' && question.answerOptions.length < 6 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              data-testid="add-option-button"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('studio.addOption')}</span>
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {question.answerOptions.map((opt, idx) => (
            <AnswerOptionRow
              key={idx}
              option={opt}
              index={idx}
              totalOptions={question.answerOptions.length}
              onChange={(updated) => handleUpdateOption(idx, updated)}
              onRemove={() => handleRemoveOption(idx)}
              isTrueFalse={question.questionType === 'TRUE_FALSE'}
            />
          ))}
        </div>
      </div>

      {/* Validation feedback */}
      {validationErrors.length > 0 && (
        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
          {validationErrors.map((err, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-amber-700 dark:text-amber-400">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{err.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

