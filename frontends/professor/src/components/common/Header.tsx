'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, Palette, History, LogOut } from 'lucide-react';
import { DynamicLogo } from './DynamicLogo';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { t, locale } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const prefix = `/${locale}`;

  const handleLogout = async () => {
    await logout();
    router.push(`${prefix}/auth/login`);
  };

  const isActive = (path: string) => {
    return pathname?.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href={`${prefix}/dashboard`} className="flex items-center gap-3 group">
            <DynamicLogo className="h-[53.2px] w-auto transition-transform group-hover:scale-105" />
            <span className="font-extrabold text-lg bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              {t('brand.name')}
            </span>
          </Link>

          {/* Navigation Links (when authenticated) */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Link
                href={`${prefix}/dashboard`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(`${prefix}/dashboard`)
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>{t('nav.dashboard')}</span>
              </Link>
              <Link
                href={`${prefix}/themes`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(`${prefix}/themes`)
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Palette className="w-4 h-4" />
                <span>{t('nav.themes')}</span>
              </Link>
              <Link
                href={`${prefix}/sessions`}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(`${prefix}/sessions`)
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <History className="w-4 h-4" />
                <span>{t('nav.sessions')}</span>
              </Link>
            </nav>
          )}
        </div>

        {/* Right Action Bar */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <LanguageSelector />

          {user ? (
            <div className="flex items-center gap-2">
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200"
                data-testid="header-user-badge"
                title={user.email}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
                  {user.name ? user.name[0] : (user.email ? user.email[0] : 'P')}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold leading-tight truncate max-w-[130px]">
                    {user.name || user.email}
                  </span>
                  {user.name && user.email && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate max-w-[130px]">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 font-semibold text-xs transition-colors shadow-sm"
                title={t('nav.logout')}
                data-testid="logout-button"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav.logout')}</span>
              </button>
            </div>
          ) : (
            <Link
              href={`${prefix}/auth/login`}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors shadow-sm"
              data-testid="header-login-link"
            >
              {t('nav.login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

