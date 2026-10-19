'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { GameSessionDetail } from '@/types/session';
import { SessionSummaryCard } from '@/components/analytics/SessionSummaryCard';
import { QuestionAnalyticsTable } from '@/components/analytics/QuestionAnalyticsTable';
import { ExportToolbar } from '@/components/analytics/ExportToolbar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useI18n } from '@/i18n/I18nProvider';
import { apiClient } from '@/lib/api-client';

export default function SessionAnalyticsPage({ params }: { params: { id: string } }) {
  const { t, locale } = useI18n();
  const [detail, setDetail] = useState<GameSessionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const prefix = `/${locale}`;

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        let res: any;
        try {
          res = await apiClient.request<GameSessionDetail>(`/sessions/${params.id}/metrics`);
        } catch {
          res = await apiClient.request<any>(`/sessions/${params.id}`);
        }
        if (res && res.session) {
          setDetail({
            session: {
              averageScore: 0,
              averageResponseTimeMs: 0,
              overallAccuracyPercentage: 0,
              ...res.session,
            },
            questions: Array.isArray(res.questions) ? res.questions : [],
          });
        } else {
          throw new Error('Invalid session response');
        }
      } catch {
        setDetail(null);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-32 text-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-bold text-slate-500">{t('analytics.loading')}</p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          {t('analytics.notFound')}
        </h2>
        <Link
          href={`${prefix}/sessions`}
          className="mt-4 inline-block text-sm text-emerald-600 font-bold hover:underline"
        >
          {t('analytics.backToSessions')}
        </Link>
      </div>
    );
  }

  return (
    <AuthGuard>
      <div
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
        data-testid="session-analytics-page"
      >
        {/* Top Navigation & Export Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <Link
              href={`${prefix}/sessions`}
              className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition print:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Link>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <span>{t('analytics.title')}</span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                PIN {detail.session.pin} • Cohort {detail.session.classGroup || 'General'}
              </p>
            </div>
          </div>

          <ExportToolbar detail={detail} />
        </div>

        {/* Summary Cards */}
        <SessionSummaryCard session={detail.session} />

        {/* Detailed Question Analytics Breakdown */}
        <QuestionAnalyticsTable questions={detail.questions} />
      </div>
    </AuthGuard>
  );
}

