'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Plus, CheckCircle, AlertCircle, UserCheck, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Quiz, Question } from '../../types/quiz';
import { QuizThemeConfig } from '../../types/theme';
import { QuizMetadataForm } from './QuizMetadataForm';
import { QuestionList } from './QuestionList';
import { QuestionEditor } from './QuestionEditor';
import { validateQuizMetadata, validateQuestion } from '../../lib/validation';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../lib/api-client';

interface QuizStudioProps {
  initialQuizId?: string;
  isNew?: boolean;
}

export function QuizStudio({ initialQuizId, isNew = false }: QuizStudioProps) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  const prefix = `/${locale}`;

  const [quiz, setQuiz] = useState<Partial<Quiz>>({
    title: '',
    description: '',
    subject: '',
    level: '',
    folder: '',
    tags: [],
    themeId: null,
    defaultQuestionTimeLimitSeconds: 20,
    defaultExecutionMode: 'MANUAL',
  });

  const [questions, setQuestions] = useState<Question[]>([
    {
      orderIndex: 0,
      questionText: '',
      questionType: 'MULTIPLE_CHOICE',
      timeLimitSeconds: 20,
      pointsMultiplier: '1.00',
      showAnswersOnDevice: true,
      answerOptions: [
        { orderIndex: 0, optionText: '', isCorrect: true, colorShapeIndex: 0 },
        { orderIndex: 1, optionText: '', isCorrect: false, colorShapeIndex: 1 },
        { orderIndex: 2, optionText: '', isCorrect: false, colorShapeIndex: 2 },
        { orderIndex: 3, optionText: '', isCorrect: false, colorShapeIndex: 3 },
      ],
    },
  ]);

  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [themes, setThemes] = useState<QuizThemeConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch available themes
  useEffect(() => {
    async function loadThemes() {
      try {
        const res = await apiClient.request<{ systemThemes: QuizThemeConfig[]; customThemes: QuizThemeConfig[] }>('/themes');
        setThemes([...(res.systemThemes || []), ...(res.customThemes || [])]);
      } catch {
        // use default presets
      }
    }
    loadThemes();
  }, []);

  // If edit mode, load existing quiz details
  useEffect(() => {
    if (!isNew && initialQuizId) {
      async function loadQuiz() {
        try {
          const res = await apiClient.request<{ quiz: Quiz; questions: any[] }>(`/quizzes/${initialQuizId}`);
          setQuiz({
            defaultQuestionTimeLimitSeconds: 20,
            defaultExecutionMode: 'MANUAL',
            ...res.quiz,
          });
          if (res.questions && res.questions.length > 0) {
            setQuestions(res.questions);
          }
        } catch {
          // offline demo fallback
        }
      }
      loadQuiz();
    }
  }, [isNew, initialQuizId]);

  const handleAddQuestion = () => {
    const nextIdx = questions.length;
    const newQ: Question = {
      orderIndex: nextIdx,
      questionText: '',
      questionType: 'MULTIPLE_CHOICE',
      timeLimitSeconds: quiz.defaultQuestionTimeLimitSeconds ?? 20,
      pointsMultiplier: '1.00',
      showAnswersOnDevice: true,
      answerOptions: [
        { orderIndex: 0, optionText: '', isCorrect: true, colorShapeIndex: 0 },
        { orderIndex: 1, optionText: '', isCorrect: false, colorShapeIndex: 1 },
        { orderIndex: 2, optionText: '', isCorrect: false, colorShapeIndex: 2 },
        { orderIndex: 3, optionText: '', isCorrect: false, colorShapeIndex: 3 },
      ],
    };
    setQuestions([...questions, newQ]);
    setSelectedIndex(nextIdx);
  };

  const handleApplyTimeToAllQuestions = (timeLimit: number) => {
    setQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        timeLimitSeconds: timeLimit,
      }))
    );
    setSuccessMsg(t('studio.timeAppliedSuccess') || 'Applied default time limit to all questions');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    const updated = questions.filter((_, i) => i !== idx).map((q, i) => ({ ...q, orderIndex: i }));
    setQuestions(updated);
    setSelectedIndex(Math.max(0, idx - 1));
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const copy = [...questions];
    const temp = copy[idx];
    copy[idx] = copy[idx - 1];
    copy[idx - 1] = temp;
    const reordered = copy.map((q, i) => ({ ...q, orderIndex: i }));
    setQuestions(reordered);
    setSelectedIndex(idx - 1);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === questions.length - 1) return;
    const copy = [...questions];
    const temp = copy[idx];
    copy[idx] = copy[idx + 1];
    copy[idx + 1] = temp;
    const reordered = copy.map((q, i) => ({ ...q, orderIndex: i }));
    setQuestions(reordered);
    setSelectedIndex(idx + 1);
  };

  const handleSaveQuiz = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);

    // Require authenticated professor
    if (!user) {
      setErrorMsg(t('studio.loginRequiredError'));
      return;
    }

    // Validate metadata
    const metaErrors = validateQuizMetadata(quiz);
    if (metaErrors.length > 0) {
      setErrorMsg(metaErrors[0].message);
      return;
    }

    // Validate each question
    for (let i = 0; i < questions.length; i++) {
      const qErrors = validateQuestion(questions[i]);
      if (qErrors.length > 0) {
        setSelectedIndex(i);
        setErrorMsg(t('studio.questionError', { num: i + 1, message: qErrors[0].message }));
        return;
      }
    }

    setSaving(true);
    try {
      if (isNew) {
        // Create quiz under authenticated professor
        const createdQuiz = await apiClient.request<Quiz>('/quizzes', {
          method: 'POST',
          body: JSON.stringify({
            ...quiz,
            defaultQuestionTimeLimitSeconds: quiz.defaultQuestionTimeLimitSeconds ?? 20,
            defaultExecutionMode: quiz.defaultExecutionMode || 'MANUAL',
            professorId: user.id,
          }),
        });

        // Add questions
        for (const q of questions) {
          await apiClient.request(`/quizzes/${createdQuiz.id}/questions`, {
            method: 'POST',
            body: JSON.stringify({
              ...q,
              options: q.answerOptions,
              answerOptions: q.answerOptions,
            }),
          });
        }
      } else if (initialQuizId) {
        // Update quiz metadata
        await apiClient.request(`/quizzes/${initialQuizId}`, {
          method: 'PUT',
          body: JSON.stringify({
            ...quiz,
            defaultQuestionTimeLimitSeconds: quiz.defaultQuestionTimeLimitSeconds ?? 20,
            defaultExecutionMode: quiz.defaultExecutionMode || 'MANUAL',
            professorId: user.id,
          }),
        });

        // Upsert questions
        for (const q of questions) {
          if (q.id) {
            await apiClient.request(`/questions/${q.id}`, {
              method: 'PUT',
              body: JSON.stringify({
                ...q,
                options: q.answerOptions || (q as any).options,
                answerOptions: q.answerOptions || (q as any).options,
              }),
            });
          } else {
            await apiClient.request(`/quizzes/${initialQuizId}/questions`, {
              method: 'POST',
              body: JSON.stringify({
                ...q,
                options: q.answerOptions || (q as any).options,
                answerOptions: q.answerOptions || (q as any).options,
              }),
            });
          }
        }
      }

      setSuccessMsg(t('studio.savedSuccess'));
      setTimeout(() => {
        router.push(`${prefix}/dashboard`);
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || t('studio.saveError'));
    } finally {
      setSaving(false);
    }
  };

  const currentQ = questions[selectedIndex] || questions[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="quiz-studio">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href={`${prefix}/dashboard`}
            className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">
              {isNew ? t('studio.createTitle') : t('studio.editTitle')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('studio.subtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {user ? (
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-medium"
              data-testid="quiz-author-badge"
            >
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>
                {t('studio.authorLabel')}:{' '}
                <strong className="font-bold text-slate-900 dark:text-white">
                  {user.name ? `${user.name} (${user.email})` : user.email}
                </strong>
              </span>
            </div>
          ) : (
            <div
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 font-medium"
              data-testid="quiz-not-logged-in-badge"
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>{t('studio.loginRequiredError')}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSaveQuiz}
            disabled={saving || !user}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-lg shadow-emerald-600/25 transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
            data-testid="save-quiz-button"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('studio.saving') : t('studio.saveQuiz')}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Quiz Properties */}
      <QuizMetadataForm
        quiz={quiz}
        themes={themes}
        onChange={(upd) => setQuiz({ ...quiz, ...upd })}
        onApplyTimeToAllQuestions={handleApplyTimeToAllQuestions}
      />

      {/* Studio Workspace: Left Question List + Right Question Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <QuestionList
            questions={questions}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onAdd={handleAddQuestion}
            onRemove={handleRemoveQuestion}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
          />
        </div>

        <div className="lg:col-span-3">
          {currentQ && (
            <QuestionEditor
              question={currentQ}
              questionNumber={selectedIndex + 1}
              onChange={(updated) => {
                const copy = [...questions];
                copy[selectedIndex] = updated;
                setQuestions(copy);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

