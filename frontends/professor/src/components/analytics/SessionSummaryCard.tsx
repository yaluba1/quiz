'use client';

import React from 'react';
import { Users, Award, Target, Clock } from 'lucide-react';
import { GameSessionDetail } from '../../types/session';
import { useI18n } from '../../i18n/I18nProvider';

interface SessionSummaryCardProps {
  session: GameSessionDetail['session'];
}

export function SessionSummaryCard({ session }: SessionSummaryCardProps) {
  const { t } = useI18n();

  return (
    <div className="space-y-4" data-testid="session-summary-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {session.title || t('analytics.untitledSession')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('analytics.cohort')}: {session.classGroup || t('analytics.cohortGeneral')} | {t('host.pin')}: {session.pin}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-500 flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('analytics.totalStudents')}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {session.totalParticipants}
            </div>
          </div>
        </div>

        {/* Average Score */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-500 flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('analytics.averageScore')}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {session.averageScore}
            </div>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-500 flex-shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('analytics.overallAccuracy')}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {session.overallAccuracyPercentage}%
            </div>
          </div>
        </div>

        {/* Average Response Time */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-500 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('analytics.avgResponseTime')}
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-0.5">
              {(session.averageResponseTimeMs / 1000).toFixed(1)}s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

