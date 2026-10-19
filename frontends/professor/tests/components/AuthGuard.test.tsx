import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AuthGuard } from '../../src/components/auth/AuthGuard';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import * as authModule from '../../src/hooks/useAuth';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/teacher/en/quizzes/new',
}));

describe('AuthGuard Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading spinner while authentication state is loading', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      loading: true,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <I18nProvider>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </I18nProvider>
    );

    expect(screen.getByTestId('auth-loading')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it('redirects to login and renders auth required fallback when unauthenticated', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <I18nProvider>
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      </I18nProvider>
    );

    expect(screen.getByTestId('auth-required')).toBeInTheDocument();
    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByTestId('auth-required-login-link')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('/en/auth/login?redirect=%2Fteacher%2Fen%2Fquizzes%2Fnew')
    );
  });

  it('renders children when professor is authenticated', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 'prof-123', email: 'prof@school.edu', name: 'Dr. Jane' },
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <I18nProvider>
        <AuthGuard>
          <div data-testid="protected-child">Secret Classroom Data</div>
        </AuthGuard>
      </I18nProvider>
    );

    expect(screen.getByTestId('protected-child')).toHaveTextContent('Secret Classroom Data');
    expect(screen.queryByTestId('auth-required')).not.toBeInTheDocument();
    expect(screen.queryByTestId('auth-loading')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

