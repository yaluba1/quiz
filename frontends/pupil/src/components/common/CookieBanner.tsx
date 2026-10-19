'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const consent = localStorage.getItem('quiz_cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('quiz_cookie_consent', 'accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('quiz_cookie_consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label={t('common.cookieBannerAria')}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-2xl animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-brand-pistachio/15 text-brand-pistachio-dark dark:text-brand-pistachio shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            {t('common.cookieNotice')}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleAccept}
              className="px-3 py-1.5 rounded-lg bg-brand-pistachio hover:bg-brand-pistachio-dark text-white font-medium text-xs transition-colors"
            >
              {t('common.accept')}
            </button>
            <button
              type="button"
              onClick={handleDecline}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-darkbg-border text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium text-xs transition-colors"
            >
              {t('common.decline')}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}

