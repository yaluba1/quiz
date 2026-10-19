import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelector } from '../../src/components/common/LanguageSelector';
import { ThemeToggle } from '../../src/components/common/ThemeToggle';
import { CookieBanner } from '../../src/components/common/CookieBanner';
import { DynamicLogo } from '../../src/components/common/DynamicLogo';
import { Footer } from '../../src/components/common/Footer';
import { I18nProvider } from '../../src/i18n/I18nProvider';

let mockPathname = '/en/dashboard';
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('Common Components Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPathname = '/en/dashboard';
  });

  it('renders DynamicLogo and handles error fallback', () => {
    render(<DynamicLogo customLogoUrl="https://example.com/logo.png" />);
    const img = screen.getByTestId('dynamic-logo') as HTMLImageElement;
    expect(img.src).toContain('https://example.com/logo.png');

    // Trigger error event
    fireEvent.error(img);
    expect(img.src).toContain('logo.svg');
  });

  it('toggles dark and light mode in ThemeToggle', () => {
    render(<ThemeToggle />);
    const button = screen.getByTestId('theme-toggle');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(localStorage.getItem('quiz_theme_mode')).toBe('dark');
  });

  it('switches locale in LanguageSelector', () => {
    render(
      <I18nProvider>
        <LanguageSelector />
      </I18nProvider>
    );

    const button = screen.getByTestId('language-selector-button');
    fireEvent.click(button);

    const esOption = screen.getByText('Español');
    fireEvent.click(esOption);

    expect(localStorage.getItem('quiz_locale')).toBe('es');
  });

  it('accepts and dismisses CookieBanner', () => {
    render(
      <I18nProvider>
        <CookieBanner />
      </I18nProvider>
    );

    expect(screen.getByTestId('cookie-banner')).toBeInTheDocument();

    const acceptBtn = screen.getByText('Accept Essential');
    fireEvent.click(acceptBtn);

    expect(localStorage.getItem('quiz_cookie_consent')).toBe('accepted');
    expect(screen.queryByTestId('cookie-banner')).not.toBeInTheDocument();
  });

  it('renders Footer with brand tagline, github repo link, and handles icon error fallback', () => {
    render(
      <I18nProvider>
        <Footer />
      </I18nProvider>
    );

    const footer = screen.getByTestId('main-footer');
    expect(footer).toBeInTheDocument();

    const githubLink = screen.getByLabelText('GitHub Repository');
    expect(githubLink).toHaveAttribute('href', 'https://github.com/yaluba1/quiz');

    const images = footer.querySelectorAll('img');
    images.forEach((img) => {
      fireEvent.error(img);
    });
  });

  it('hides Footer on host projector screens', () => {
    mockPathname = '/teacher/en/host/quiz-123';
    render(
      <I18nProvider>
        <Footer />
      </I18nProvider>
    );

    expect(screen.queryByTestId('main-footer')).not.toBeInTheDocument();
  });
});


