import './globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'OpenQuiz Professor - Dashboard & Live Classroom Host',
  description: 'Gamified quiz creator, theme customizer, and classroom projector screen for educators.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors">
        {children}
      </body>
    </html>
  );
}

