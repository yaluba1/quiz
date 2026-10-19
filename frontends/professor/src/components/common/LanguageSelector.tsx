'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';
import { LOCALES, Locale } from '../../i18n/config';

export function LanguageSelector({ className = '' }: { className?: string }) {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
        data-testid="language-selector-button"
      >
        <Globe className="w-4 h-4 text-emerald-500" />
        <span>{LOCALES[locale]?.nativeName || locale.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-44 rounded-lg shadow-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
          role="menu"
          data-testid="language-dropdown"
        >
          {Object.values(LOCALES).map((loc) => (
            <button
              key={loc.code}
              type="button"
              onClick={() => {
                setLocale(loc.code as Locale);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${
                loc.code === locale
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-700 dark:text-slate-200'
              }`}
              role="menuitem"
            >
              <span>{loc.nativeName}</span>
              <span className="text-xs text-slate-400 uppercase">{loc.code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

