'use client';

import React from 'react';
import { ThemeStudio } from '@/components/theme/ThemeStudio';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { QuizThemeConfig } from '@/types/theme';
import { apiClient } from '@/lib/api-client';

export default function ThemesPage() {
  const handleSaveTheme = async (theme: QuizThemeConfig) => {
    try {
      await apiClient.request('/themes', {
        method: 'POST',
        body: JSON.stringify(theme),
      });
    } catch {
      // offline fallback
    }
  };

  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ThemeStudio onSave={handleSaveTheme} />
      </div>
    </AuthGuard>
  );
}
