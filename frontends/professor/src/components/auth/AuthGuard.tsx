'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n/I18nProvider';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const { locale, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const prefix = `/${locale}`;
  const loginUrl = `${prefix}/auth/login`;

  useEffect(() => {
    if (!loading && !user) {
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
      router.push(`${loginUrl}${redirectParam}`);
    }
  }, [loading, user, router, loginUrl, pathname]);

  if (loading) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4"
        data-testid="auth-loading"
      >
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
          {t('common.loading') || 'Checking authentication...'}
        </p>
      </div>
    );
  }

  if (!user) {
    const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : '';
    return (
      <div
        className="min-h-[65vh] flex flex-col items-center justify-center p-8 text-center space-y-6"
        data-testid="auth-required"
      >
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400">
          <ShieldAlert className="w-12 h-12 mx-auto" />
        </div>
        <div className="max-w-md space-y-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {t('auth.loginRequired')}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('auth.loginRequiredDesc')}
          </p>
        </div>
        <Link
          href={`${loginUrl}${redirectParam}`}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition transform hover:scale-105 active:scale-95"
          data-testid="auth-required-login-link"
        >
          <span>{t('auth.submitLogin')}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}

