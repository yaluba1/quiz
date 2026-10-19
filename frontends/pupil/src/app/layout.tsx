import './globals.css';
import type { Metadata, Viewport } from 'next';
import { I18nProvider } from '../i18n/I18nProvider';
import { CookieBanner } from '../components/common/CookieBanner';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'OpenQuiz - Interactive Quizzes',
  description: 'Fast, open-source, mobile-first live classroom quiz game for students.',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white dark:bg-darkbg-primary text-slate-900 dark:text-slate-100 min-h-screen flex flex-col transition-colors selection:bg-brand-pistachio/30 selection:text-brand-pumpkin">
        <I18nProvider>
          {children}
          <CookieBanner />
        </I18nProvider>
      </body>
    </html>
  );
}
