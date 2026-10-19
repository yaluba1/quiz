'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, Key, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useI18n } from '../../i18n/I18nProvider';

export function ForgotPasswordForm() {
  const { t, locale } = useI18n();
  const { requestPasswordReset, resetPassword } = useAuth();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const prefix = `/${locale}`;

  useEffect(() => {
    const urlToken = searchParams?.get('token');
    if (urlToken) {
      setToken(urlToken);
      setStep('reset');
    }
  }, [searchParams]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await requestPasswordReset(email);
      setSuccessMsg(res.message);
      if (res.resetToken) {
        setToken(res.resetToken);
      }
      setStep('reset');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to request reset token');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await resetPassword({ token, newPassword });
      setSuccessMsg('Password updated successfully! You can now sign in.');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
      <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">
        {t('auth.forgotTitle')}
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 text-center">
        {step === 'request' ? 'Enter your email to receive recovery instructions.' : 'Enter your reset token and new password.'}
      </p>

      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleRequest} className="space-y-4">
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
                data-testid="forgot-email-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="forgot-submit-button"
          >
            {loading ? '...' : (
              <>
                <span>{t('auth.submitForgot')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('auth.resetToken')}
            </label>
            <div className="relative">
              <Key className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder={t('auth.resetTokenPlaceholder')}
                data-testid="reset-token-input"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('auth.newPassword')}
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition"
                placeholder="••••••••"
                data-testid="new-password-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            data-testid="reset-password-button"
          >
            {loading ? '...' : (
              <>
                <span>{t('auth.submitReset')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
        {t('auth.rememberPassword')}{' '}
        <Link
          href={`${prefix}/auth/login`}
          className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
        >
          {t('auth.submitLogin')}
        </Link>
      </div>
    </div>
  );
}

