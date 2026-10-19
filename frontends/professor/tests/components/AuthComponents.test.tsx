import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginForm } from '../../src/components/auth/LoginForm';
import { RegisterForm } from '../../src/components/auth/RegisterForm';
import { ForgotPasswordForm } from '../../src/components/auth/ForgotPasswordForm';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import { MockAuthProvider } from '../../src/services/auth/mock.service';
import { setAuthProvider } from '../../src/services/auth/auth-factory';

let mockQueryToken: string | null = null;

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/teacher/en/auth/login',
  useSearchParams: () => ({
    get: (key: string) => (key === 'redirect' ? '/teacher/en/quizzes/new' : key === 'token' ? mockQueryToken : null),
  }),
}));

describe('Auth Components Tests', () => {
  it('submits LoginForm successfully with mock auth provider', async () => {
    setAuthProvider(new MockAuthProvider());

    render(
      <I18nProvider>
        <LoginForm />
      </I18nProvider>
    );

    const emailInput = screen.getByTestId('login-email-input');
    const passwordInput = screen.getByTestId('login-password-input');
    const submitBtn = screen.getByTestId('login-submit-button');

    fireEvent.change(emailInput, { target: { value: 'prof@school.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
    });
  });

  it('displays error in LoginForm on failed authentication', async () => {
    const mock = new MockAuthProvider();
    setAuthProvider(mock);

    render(
      <I18nProvider>
        <LoginForm />
      </I18nProvider>
    );

    const emailInput = screen.getByTestId('login-email-input');
    const passwordInput = screen.getByTestId('login-password-input');
    const submitBtn = screen.getByTestId('login-submit-button');

    fireEvent.change(emailInput, { target: { value: 'prof@school.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'wrong-password' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
  });

  it('submits RegisterForm successfully', async () => {
    setAuthProvider(new MockAuthProvider());

    render(
      <I18nProvider>
        <RegisterForm />
      </I18nProvider>
    );

    const nameInput = screen.getByTestId('register-name-input');
    const emailInput = screen.getByTestId('register-email-input');
    const passwordInput = screen.getByTestId('register-password-input');
    const submitBtn = screen.getByTestId('register-submit-button');

    fireEvent.change(nameInput, { target: { value: 'Dr. Jane' } });
    fireEvent.change(emailInput, { target: { value: 'jane@school.edu' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.queryByText(/failed/i)).not.toBeInTheDocument();
      expect(screen.getByTestId('proceed-to-login-button')).toBeInTheDocument();
    });
  });

  it('submits ForgotPasswordForm and proceeds to reset password', async () => {
    setAuthProvider(new MockAuthProvider());

    render(
      <I18nProvider>
        <ForgotPasswordForm />
      </I18nProvider>
    );

    const emailInput = screen.getByTestId('forgot-email-input');
    const submitBtn = screen.getByTestId('forgot-submit-button');

    fireEvent.change(emailInput, { target: { value: 'jane@school.edu' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByTestId('reset-password-button')).toBeInTheDocument();
    });

    const newPassInput = screen.getByTestId('new-password-input');
    fireEvent.change(newPassInput, { target: { value: 'brandNewPass123' } });
    fireEvent.click(screen.getByTestId('reset-password-button'));

    await waitFor(() => {
      expect(screen.getByText(/Password updated successfully/i)).toBeInTheDocument();
    });
  });

  it('renders VerifyEmailPage and activates account', async () => {
    mockQueryToken = 'valid-mock-token';
    const VerifyEmailPage = (await import('../../src/app/[locale]/auth/verify/page')).default;
    setAuthProvider(new MockAuthProvider());

    render(
      <I18nProvider>
        <VerifyEmailPage />
      </I18nProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('verify-success-signin')).toBeInTheDocument();
    });
    mockQueryToken = null;
  });
});

