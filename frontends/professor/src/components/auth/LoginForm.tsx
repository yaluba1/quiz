'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n/I18nProvider';

export function LoginForm() {
  const { t, locale } = useI18n();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const prefix = `/${locale}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login({ email, password });
      const redirectParam = searchParams?.get('redirect');
      if (redirectParam && redirectParam.startsWith('/') && !redirectParam.includes('/quizzes/new')) {
        router.push(redirectParam);
      } else {
        router.push(`${prefix}/dashboard`);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">
        {t('auth.loginTitle')}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
        {t('brand.tagline')}
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('auth.email')}
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder={t('auth.emailPlaceholder')}
              data-testid="login-email-input"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t('auth.password')}
            </label>
            <Link
              href={`${prefix}/auth/forgot-password`}
              className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('auth.forgotPasswordLink')}
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="••••••••"
              data-testid="login-password-input"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          data-testid="login-submit-button"
        >
          {loading ? '...' : (
            <>
              <span>{t('auth.submitLogin')}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
        {t('auth.dontHaveAccount')}{' '}
        <Link
          href={`${prefix}/auth/register`}
          className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
        >
          {t('auth.submitRegister')}
        </Link>
      </div>
    </div>
  );
}

