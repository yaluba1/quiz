import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from '../../src/app/page';
import { I18nProvider } from '../../src/i18n/I18nProvider';

describe('LandingPage', () => {
  it('renders hero title, embedded PIN entry, and CTA links', () => {
    render(
      <I18nProvider>
        <LandingPage />
      </I18nProvider>
    );

    expect(screen.getByText(/Interactive Quizzes/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter 6-digit PIN/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Teacher Portal/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Why Choose OpenQuiz\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Frequently Asked Questions/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/yaluba1/quiz'
    );
  });

  it('validates PIN before submitting on hero quick form', () => {
    render(
      <I18nProvider>
        <LandingPage />
      </I18nProvider>
    );

    const input = screen.getByPlaceholderText(/Enter 6-digit PIN/i);
    const joinBtn = screen.getByRole('button', { name: /Join Game/i });

    // Submit with short PIN
    fireEvent.change(input, { target: { value: '123' } });
    fireEvent.click(joinBtn);

    expect(screen.getByText(/Please enter a valid 6-digit numeric PIN/i)).toBeInTheDocument();

    // Submit with valid 6-digit PIN
    fireEvent.change(input, { target: { value: '654321' } });
    fireEvent.click(joinBtn);
    expect(screen.queryByText(/Please enter a valid 6-digit numeric PIN/i)).not.toBeInTheDocument();
  });
});
