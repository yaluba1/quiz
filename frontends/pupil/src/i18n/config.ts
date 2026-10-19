export type Locale = 'en' | 'es' | 'de' | 'fr' | 'it' | 'pt' | 'ca' | 'ja';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const LOCALES: Record<Locale, LocaleConfig> = {
  en: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  es: { code: 'es', name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
  de: { code: 'de', name: 'German', nativeName: 'Deutsch', dir: 'ltr' },
  fr: { code: 'fr', name: 'French', nativeName: 'Français', dir: 'ltr' },
  it: { code: 'it', name: 'Italian', nativeName: 'Italiano', dir: 'ltr' },
  pt: { code: 'pt', name: 'Portuguese', nativeName: 'Português', dir: 'ltr' },
  ca: { code: 'ca', name: 'Catalan', nativeName: 'Català', dir: 'ltr' },
  ja: { code: 'ja', name: 'Japanese', nativeName: '日本語', dir: 'ltr' },
};

export const DEFAULT_LOCALE: Locale = 'en';

export function isRTL(locale: string): boolean {
  return locale === 'ar' || locale === 'he';
}

