'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, PlusCircle, BookOpen, Layers, User } from 'lucide-react';
import { Quiz } from '@/types/quiz';
import { QuizCard } from '@/components/library/QuizCard';
import { FolderTree } from '@/components/library/FolderTree';
import { LevelSelector } from '@/components/library/LevelSelector';
import { SubjectSelector } from '@/components/library/SubjectSelector';
import { TagFilterBar } from '@/components/library/TagFilterBar';
import { HostSessionModal } from '@/components/library/HostSessionModal';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useI18n } from '@/i18n/I18nProvider';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api-client';

export default function DashboardPage() {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Modals state
  const [hostingQuiz, setHostingQuiz] = useState<Quiz | null>(null);
  const [deleteQuizId, setDeleteQuizId] = useState<string | null>(null);

  const prefix = `/${locale}`;

  // Fetch quizzes
  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const data = await apiClient.request<{ quizzes: Quiz[] }>('/quizzes', {
        method: 'GET',
      });
      setQuizzes(data.quizzes || []);
    } catch {
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Compute unique folders, levels, subjects, tags
  const folders = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.folder) set.add(q.folder);
    });
    return Array.from(set);
  }, [quizzes]);

  const levels = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.level) set.add(q.level);
    });
    return Array.from(set);
  }, [quizzes]);

  const subjects = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set);
  }, [quizzes]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.tags) q.tags.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [quizzes]);

  // Filtered quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      if (search && !q.title.toLowerCase().includes(search.toLowerCase())) {
        return false;
      }
      if (selectedFolder && q.folder !== selectedFolder) {
        return false;
      }
      if (selectedLevel && q.level !== selectedLevel) {
        return false;
      }
      if (selectedSubject && q.subject !== selectedSubject) {
        return false;
      }
      if (selectedTag && (!q.tags || !q.tags.includes(selectedTag))) {
        return false;
      }
      return true;
    });
  }, [quizzes, search, selectedFolder, selectedLevel, selectedSubject, selectedTag]);

  const handleDuplicate = async (quizId: string) => {
    try {
      await apiClient.request(`/quizzes/${quizId}/duplicate`, { method: 'POST' });
      fetchQuizzes();
    } catch {
      // Mock duplicate
      const original = quizzes.find((q) => q.id === quizId);
      if (original) {
        const copy: Quiz = {
          ...original,
          id: `demo-quiz-${Date.now()}`,
          title: `${original.title} (Copy)`,
          playCount: 0,
        };
        setQuizzes([copy, ...quizzes]);
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteQuizId) return;
    try {
      await apiClient.request(`/quizzes/${deleteQuizId}`, { method: 'DELETE' });
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteQuizId));
    } catch {
      setQuizzes((prev) => prev.filter((q) => q.id !== deleteQuizId));
    } finally {
      setDeleteQuizId(null);
    }
  };

  const handleLaunchSession = (params: {
    quizId: string;
    title?: string;
    classGroup?: string;
    durationMinutes?: number;
    executionMode?: 'MANUAL' | 'AUTOMATIC';
  }) => {
    setHostingQuiz(null);
    const query = new URLSearchParams();
    if (params.title) query.set('title', params.title);
    if (params.classGroup) query.set('classGroup', params.classGroup);
    if (params.durationMinutes) query.set('duration', String(params.durationMinutes));
    if (params.executionMode) query.set('mode', params.executionMode);
    router.push(`${prefix}/host/${params.quizId}?${query.toString()}`);
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8" data-testid="dashboard-page">
        {/* Top Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              <span>{t('dashboard.title')}</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {t('dashboard.subtitle')}
            </p>
            {user && (
              <div
                className="inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
                data-testid="dashboard-professor-indicator"
              >
                <User className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  {t('dashboard.welcomeProfessor', { name: user.name || user.email }) ||
                    `Logged in as Professor: ${user.name || user.email}`}
                </span>
              </div>
            )}
          </div>

          <Link
            href={`${prefix}/quizzes/new`}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition transform hover:scale-105 active:scale-95"
            data-testid="create-quiz-button"
          >
            <PlusCircle className="w-5 h-5" />
            <span>{t('nav.newQuiz')}</span>
          </Link>
        </div>

      {/* Main Grid: Left Folders Sidebar + Right Quiz Library */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column: Folders & Filters */}
        <div className="lg:col-span-1 space-y-6">
          <FolderTree
            folders={folders}
            selectedFolder={selectedFolder}
            onSelectFolder={setSelectedFolder}
          />
        </div>

        {/* Right Column: Search, Tag chips, Quiz Cards */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('dashboard.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition"
                data-testid="dashboard-search-input"
              />
            </div>

            <LevelSelector
              levels={levels}
              selectedLevel={selectedLevel}
              onSelectLevel={setSelectedLevel}
            />

            <SubjectSelector
              subjects={subjects}
              selectedSubject={selectedSubject}
              onSelectSubject={setSelectedSubject}
            />
          </div>

          {/* Interactive Tag Filter Bar */}
          <TagFilterBar
            tags={allTags}
            selectedTag={selectedTag}
            onSelectTag={setSelectedTag}
          />

          {/* Quiz Cards Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">{t('dashboard.loading')}</p>
            </div>
          ) : filteredQuizzes.length === 0 ? (
            <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8">
              <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                {t('dashboard.noQuizzes')}
              </h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="quizzes-grid">
              {filteredQuizzes.map((quiz) => (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  onHost={setHostingQuiz}
                  onDuplicate={handleDuplicate}
                  onDelete={setDeleteQuizId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Host Session Modal */}
      <HostSessionModal
        quiz={hostingQuiz}
        isOpen={Boolean(hostingQuiz)}
        onClose={() => setHostingQuiz(null)}
        onLaunch={handleLaunchSession}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteQuizId)}
        title={t('dashboard.delete')}
        message={t('dashboard.confirmDelete')}
        confirmLabel={t('dashboard.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setDeleteQuizId(null)}
      />
    </div>
  </AuthGuard>
);
}

