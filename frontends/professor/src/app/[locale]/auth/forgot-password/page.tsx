'use client';

import { Suspense } from 'react';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';
import { useI18n } from '@/i18n/I18nProvider';

function AuthFallback() {
  const { t } = useI18n();
  return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Suspense fallback={<AuthFallback />}>
        <ForgotPasswordForm />
      </Suspense>
    </div>
  );
}
