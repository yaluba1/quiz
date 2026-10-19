'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, DEFAULT_LOCALE, LOCALES, isRTL } from './config';
import en from './messages/en.json';
import es from './messages/es.json';
import de from './messages/de.json';
import fr from './messages/fr.json';
import it from './messages/it.json';
import pt from './messages/pt.json';
import ca from './messages/ca.json';
import ja from './messages/ja.json';

const dictionaries: Record<Locale, any> = {
  en,
  es,
  de,
  fr,
  it,
  pt,
  ca,
  ja,
};

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (keyPath: string, vars?: Record<string, string | number>) => string;
  isRtl: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    // 1. Check localStorage
    const saved = localStorage.getItem('quiz_locale') as Locale | null;
    if (saved && LOCALES[saved]) {
      setLocaleState(saved);
      return;
    }

    // 2. Browser detection
    if (typeof navigator !== 'undefined') {
      const browserLang = navigator.language?.slice(0, 2).toLowerCase() as Locale;
      if (browserLang && LOCALES[browserLang]) {
        setLocaleState(browserLang);
      }
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_locale', newLocale);
      document.documentElement.lang = newLocale;
      document.documentElement.dir = isRTL(newLocale) ? 'rtl' : 'ltr';
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
      document.documentElement.dir = isRTL(locale) ? 'rtl' : 'ltr';
    }
  }, [locale]);

  const t = (keyPath: string, vars?: Record<string, string | number>): string => {
    const parts = keyPath.split('.');
    let current = dictionaries[locale] || dictionaries[DEFAULT_LOCALE];

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to English
        let fallback = dictionaries[DEFAULT_LOCALE];
        for (const fPart of parts) {
          if (fallback && typeof fallback === 'object' && fPart in fallback) {
            fallback = fallback[fPart];
          } else {
            return keyPath;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return keyPath;
    }

    let text = current;
    if (vars) {
      for (const [vKey, vVal] of Object.entries(vars)) {
        text = text.replace(new RegExp(`{${vKey}}`, 'g'), String(vVal));
      }
    }

    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, isRtl: isRTL(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

