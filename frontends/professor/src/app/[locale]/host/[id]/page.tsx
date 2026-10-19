'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { HostProjector } from '@/components/host/HostProjector';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function HostQuizPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const sessionTitle = searchParams.get('title') || undefined;
  const classGroup = searchParams.get('classGroup') || undefined;
  const themeId = searchParams.get('themeId') || undefined;
  const executionMode = (searchParams.get('mode') as 'MANUAL' | 'AUTOMATIC') || undefined;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
        <HostProjector
          quizId={params.id}
          sessionTitle={sessionTitle}
          classGroup={classGroup}
          themeId={themeId}
          executionMode={executionMode}
        />
      </div>
    </AuthGuard>
  );
}
