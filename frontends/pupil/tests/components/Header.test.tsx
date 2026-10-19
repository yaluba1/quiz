import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../src/components/common/Header';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('Header component', () => {
  it('renders brand logo and action controls', () => {
    render(
      <I18nProvider>
        <Header />
      </I18nProvider>
    );

    expect(screen.getByAltText('OpenQuiz Logo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sound/i })).toBeInTheDocument();
  });

  it('renders custom room logo when logoUrl is provided', () => {
    render(
      <I18nProvider>
        <Header logoUrl="https://example.com/school-logo.png" />
      </I18nProvider>
    );

    expect(screen.getByAltText('Quiz Room Logo')).toBeInTheDocument();
  });

  it('toggles sound mute state on button click', () => {
    render(
      <I18nProvider>
        <Header />
      </I18nProvider>
    );

    const soundBtn = screen.getByRole('button', { name: /Sound/i });
    fireEvent.click(soundBtn);
    expect(screen.getByRole('button', { name: /Muted/i })).toBeInTheDocument();
  });

  it('renders back to home link when showBackToHome is true', () => {
    render(
      <I18nProvider>
        <Header showBackToHome={true} />
      </I18nProvider>
    );

    expect(screen.getByText(/Back to Home/i)).toBeInTheDocument();
  });
});
