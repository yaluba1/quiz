import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CookieBanner } from '../../src/components/common/CookieBanner';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('CookieBanner component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders cookie consent and saves accept decision', () => {
    render(
      <I18nProvider>
        <CookieBanner />
      </I18nProvider>
    );

    const acceptBtn = screen.getByRole('button', { name: /Accept/i });
    expect(acceptBtn).toBeInTheDocument();

    fireEvent.click(acceptBtn);
    expect(localStorage.getItem('quiz_cookie_consent')).toBe('accepted');
    expect(screen.queryByRole('button', { name: /Accept/i })).not.toBeInTheDocument();
  });

  it('saves decline decision', () => {
    render(
      <I18nProvider>
        <CookieBanner />
      </I18nProvider>
    );

    const declineBtn = screen.getByRole('button', { name: /Decline/i });
    fireEvent.click(declineBtn);
    expect(localStorage.getItem('quiz_cookie_consent')).toBe('declined');
  });
});

