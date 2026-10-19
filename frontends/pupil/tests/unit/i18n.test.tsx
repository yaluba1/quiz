import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { I18nProvider, useI18n } from '../../src/i18n/I18nProvider';
import { isRTL } from '../../src/i18n/config';

function TestConsumer() {
  const { locale, setLocale, t, isRtl } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="isRtl">{String(isRtl)}</span>
      <span data-testid="translation">{t('common.appTitle')}</span>
      <span data-testid="interpolated">{t('game.streakText', { count: 5 })}</span>
      <span data-testid="fallback">{t('non.existent.key')}</span>
      <button onClick={() => setLocale('es')}>Set ES</button>
      <button onClick={() => setLocale('ja')}>Set JA</button>
    </div>
  );
}

describe('I18nProvider & useI18n', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders translations and switches locale', () => {
    render(
      <I18nProvider>
        <TestConsumer />
      </I18nProvider>
    );

    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(screen.getByTestId('translation')).toHaveTextContent('OpenQuiz');
    expect(screen.getByTestId('fallback')).toHaveTextContent('non.existent.key');

    act(() => {
      screen.getByText('Set ES').click();
    });

    expect(screen.getByTestId('locale')).toHaveTextContent('es');
    expect(localStorage.getItem('quiz_locale')).toBe('es');
  });

  it('detects RTL languages properly', () => {
    expect(isRTL('ar')).toBe(true);
    expect(isRTL('he')).toBe(true);
    expect(isRTL('en')).toBe(false);
    expect(isRTL('es')).toBe(false);
  });

  it('throws error when useI18n is used outside I18nProvider', () => {
    expect(() => render(<TestConsumer />)).toThrow(
      'useI18n must be used within an I18nProvider'
    );
  });
});

