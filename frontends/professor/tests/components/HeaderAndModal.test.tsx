import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Header } from '../../src/components/common/Header';
import { ConfirmModal } from '../../src/components/common/ConfirmModal';
import { I18nProvider } from '../../src/i18n/I18nProvider';
import * as authModule from '../../src/hooks/useAuth';

let mockCurrentPath = '/teacher/en/dashboard';
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  usePathname: () => mockCurrentPath,
  useRouter: () => ({ push: mockPush }),
}));

describe('Header and ConfirmModal Components Tests', () => {
  it('renders Header with navigation links when authenticated', () => {
    const logout = vi.fn();
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 'prof-1', email: 'prof@test.com' },
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout,
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    render(
      <I18nProvider>
        <Header />
      </I18nProvider>
    );

    expect(screen.getByText('Library')).toBeInTheDocument();
    expect(screen.getByText(/Design|Theme/i)).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.queryByText('New Quiz')).not.toBeInTheDocument();
    expect(screen.getByTestId('header-user-badge')).toBeInTheDocument();
    expect(screen.getByText('prof@test.com')).toBeInTheDocument();

    const logoutBtn = screen.getByTestId('logout-button');
    fireEvent.click(logoutBtn);
    expect(logout).toHaveBeenCalled();
  });

  it('renders Header with professor name and avatar initial', () => {
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 'prof-2', email: 'jane@test.com', name: 'Dr. Jane' },
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
        <Header />
      </I18nProvider>
    );

    expect(screen.getByText('Dr. Jane')).toBeInTheDocument();
    expect(screen.getByText('jane@test.com')).toBeInTheDocument();
    expect(screen.getByText('D')).toBeInTheDocument();
  });

  it('renders Header with active themes and sessions routes and initial fallback', () => {
    mockCurrentPath = '/teacher/en/themes';
    vi.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { id: 'prof-3', email: '' },
      loading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      refreshUser: vi.fn(),
    });

    const { rerender } = render(
      <I18nProvider>
        <Header />
      </I18nProvider>
    );

    expect(screen.getByText('P')).toBeInTheDocument();

    mockCurrentPath = '/teacher/en/sessions';
    rerender(
      <I18nProvider>
        <Header />
      </I18nProvider>
    );
    expect(screen.getByText('Sessions')).toBeInTheDocument();

    mockCurrentPath = '/teacher/en/dashboard';
  });

  it('renders ConfirmModal and fires confirm and cancel events', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const { rerender } = render(
      <ConfirmModal
        isOpen={false}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.queryByTestId('confirm-modal')).not.toBeInTheDocument();

    rerender(
      <ConfirmModal
        isOpen={true}
        title="Delete Item"
        message="Are you sure?"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    expect(screen.getByTestId('confirm-modal')).toBeInTheDocument();
    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Confirm'));
    expect(onConfirm).toHaveBeenCalled();
  });
});

