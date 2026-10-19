'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { LOCALES, Locale } from '../../i18n/config';

interface LanguageSelectorProps {
  className?: string;
}

export function LanguageSelector({ className = '' }: LanguageSelectorProps) {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentConfig = LOCALES[locale] || LOCALES.en;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors bg-white/80 dark:bg-darkbg-card/80 border-slate-200 dark:border-darkbg-border text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        <Globe className="w-4 h-4 text-brand-pistachio" />
        <span>{currentConfig.nativeName}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <ul
          role="listbox"
          aria-label={t('common.selectLanguage')}
          className="absolute right-0 mt-2 w-40 rounded-xl bg-white dark:bg-darkbg-card border border-slate-200 dark:border-darkbg-border shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          {Object.entries(LOCALES).map(([code, config]) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => {
                  setLocale(code as Locale);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                  locale === code
                    ? 'bg-brand-pistachio/15 text-brand-pumpkin font-semibold'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{config.nativeName}</span>
                <span className="text-xs uppercase text-slate-400">{code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

