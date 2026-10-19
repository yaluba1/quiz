'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { History, BarChart3, Users, Clock, Calendar } from 'lucide-react';
import { GameSessionSummary } from '@/types/session';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useI18n } from '@/i18n/I18nProvider';
import { formatDate } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

export default function SessionsPage() {
  const { t, locale } = useI18n();
  const [sessions, setSessions] = useState<GameSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const prefix = `/${locale}`;

  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const res = await apiClient.request<{ sessions: GameSessionSummary[] }>('/sessions');
        setSessions(res.sessions || []);
      } catch {
        setSessions([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" data-testid="sessions-page">
      <div className="pb-6 border-b border-slate-200 dark:border-slate-800">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <History className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          <span>{t('nav.sessions')}</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('sessions.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-400">{t('sessions.loading')}</p>
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8">
          <History className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {t('sessions.noSessions')}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="sessions-list">
          {sessions.map((s) => (
            <div
              key={s.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              data-testid={`session-card-${s.id}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    PIN: {s.pin}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    {s.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                  {s.title || s.quizTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  {s.quizTitle} {s.classGroup ? `• ${s.classGroup}` : ''}
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-3 border-t border-slate-100 dark:border-slate-700 mb-4">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>{t('sessions.studentsCount', { count: s.totalParticipants })}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(s.startedAt)}</span>
                  </span>
                </div>

                <Link
                  href={`${prefix}/analytics/${s.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-xs font-bold transition"
                  data-testid={`view-analytics-${s.id}`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span>{t('sessions.viewAnalytics')}</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </AuthGuard>
);
}

