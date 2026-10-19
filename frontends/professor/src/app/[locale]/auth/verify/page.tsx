'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../../../hooks/useAuth';
import { useI18n } from '../../../../i18n/I18nProvider';

function VerifyEmailContent() {
  const { t, locale } = useI18n();
  const { verifyEmail } = useAuth();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const prefix = `/${locale}`;
  const token = searchParams?.get('token');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMsg('No verification token provided in URL.');
      return;
    }

    let isMounted = true;
    verifyEmail(token)
      .then(() => {
        if (isMounted) {
          setSuccess(true);
          setLoading(false);
        }
      })
      .catch((err: any) => {
        if (isMounted) {
          setErrorMsg(err.message || 'Verification token is invalid or has expired.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, verifyEmail]);

  return (
    <div className="w-full max-w-md p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
      {loading ? (
        <div className="py-8 space-y-4">
          <Loader2 className="w-12 h-12 mx-auto text-emerald-600 animate-spin" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Verifying your account...
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Please wait while we validate your activation token.
          </p>
        </div>
      ) : success ? (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('auth.verifySuccess') || 'Account Activated!'}
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('auth.verifySuccessDesc') || 'Your email has been verified successfully. You can now sign in and create interactive quizzes.'}
          </p>
          <div className="pt-4">
            <Link
              href={`${prefix}/auth/login`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition"
              data-testid="verify-success-signin"
            >
              <span>{t('auth.submitLogin')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('auth.verifyFailed') || 'Verification Failed'}
          </h2>
          <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">
            {errorMsg}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('auth.verifyFailedDesc') || 'The link may have expired or was already used. Please request a new verification or sign in.'}
          </p>
          <div className="pt-4">
            <Link
              href={`${prefix}/auth/login`}
              className="inline-flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm shadow-md transition dark:bg-slate-700 dark:hover:bg-slate-600"
              data-testid="verify-failed-signin"
            >
              <span>{t('auth.submitLogin')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function VerifyEmailFallback() {
  const { t } = useI18n();
  return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Suspense fallback={<VerifyEmailFallback />}>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
