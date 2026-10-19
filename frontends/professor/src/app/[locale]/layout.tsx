import { ReactNode } from 'react';
import { I18nProvider } from '../../i18n/I18nProvider';
import { Locale, LOCALES } from '../../i18n/config';
import { Header } from '../../components/common/Header';
import { Footer } from '../../components/common/Footer';
import { CookieBanner } from '../../components/common/CookieBanner';

export function generateStaticParams() {
  return Object.keys(LOCALES).map((loc) => ({ locale: loc }));
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const currentLocale = (params?.locale as Locale) || 'en';

  return (
    <I18nProvider initialLocale={currentLocale}>
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <CookieBanner />
      </div>
    </I18nProvider>
  );
}

