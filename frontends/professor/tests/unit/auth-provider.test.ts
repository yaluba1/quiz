import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockAuthProvider } from '../../src/services/auth/mock.service';
import { SelfHostedAuthProvider } from '../../src/services/auth/self-hosted.service';
import { getAuthProvider, setAuthProvider } from '../../src/services/auth/auth-factory';
import { apiClient } from '../../src/lib/api-client';

describe('Auth Provider Unit & Adapter Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('MockAuthProvider', () => {
    it('handles login success and failure', async () => {
      const mock = new MockAuthProvider();

      const success = await mock.login({ email: 'prof@test.com', password: 'correct-password' });
      expect(success.user.email).toBe('prof@test.com');
      expect(success.tokens.accessToken).toBe('mock-jwt-token');

      await expect(
        mock.login({ email: 'prof@test.com', password: 'wrong-password' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('handles registration, logout, and password recovery', async () => {
      const mock = new MockAuthProvider();

      const registered = await mock.register({ email: 'new@test.com', password: 'password', name: 'Dr. New' });
      expect(registered.user.name).toBe('Dr. New');

      const user = await mock.getUser();
      expect(user?.email).toBe('new@test.com');

      const resetRes = await mock.requestPasswordReset('new@test.com');
      expect(resetRes.success).toBe(true);

      const updateRes = await mock.resetPassword({ token: 'tok', newPassword: 'new-pass' });
      expect(updateRes.success).toBe(true);

      const refreshed = await mock.refreshToken();
      expect(refreshed?.accessToken).toBe('mock-refreshed-jwt-token');

      await mock.logout();
      expect(await mock.getUser()).toBeNull();
    });
  });

  describe('SelfHostedAuthProvider', () => {
    it('calls API client endpoints properly', async () => {
      const requestSpy = vi.spyOn(apiClient, 'request').mockImplementation(async (endpoint, options: any) => {
        if (endpoint === '/auth/login') {
          return { user: { id: '1', email: 'test@api.com' }, accessToken: 'token-123', expiresIn: 3600 };
        }
        if (endpoint === '/auth/register') {
          return { success: true, message: 'sent', requiresVerification: true, user: { id: '2', email: 'reg@api.com' }, accessToken: 'token-456' };
        }
        if (endpoint === '/auth/verify-email') {
          return { success: true, message: 'verified' };
        }
        if (endpoint === '/auth/me') {
          return { user: { id: '1', email: 'test@api.com' } };
        }
        if (endpoint === '/auth/refresh') {
          return { accessToken: 'token-refreshed' };
        }
        if (endpoint === '/auth/forgot-password') {
          return { success: true, message: 'sent' };
        }
        if (endpoint === '/auth/reset-password') {
          return { success: true };
        }
        if (endpoint === '/auth/logout') {
          return { success: true };
        }
        return {};
      });

      const provider = new SelfHostedAuthProvider();

      const loginRes = await provider.login({ email: 'test@api.com', password: 'pass' });
      expect(loginRes.tokens.accessToken).toBe('token-123');

      const user = await provider.getUser();
      expect(user?.id).toBe('1');

      const regRes = await provider.register({ email: 'reg@api.com', password: 'pass', name: 'Dr. Reg' });
      expect(regRes.tokens?.accessToken).toBe('token-456');
      expect(requestSpy).toHaveBeenCalledWith('/auth/register', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'reg@api.com', password: 'pass', displayName: 'Dr. Reg', locale: 'en' }),
      }));

      const verifyRes = await provider.verifyEmail('valid-tok');
      expect(verifyRes.success).toBe(true);

      const refreshRes = await provider.refreshToken();
      expect(refreshRes?.accessToken).toBe('token-refreshed');

      const forgotRes = await provider.requestPasswordReset('test@api.com');
      expect(forgotRes.success).toBe(true);

      const resetRes = await provider.resetPassword({ token: 'tok', newPassword: 'new' });
      expect(resetRes.success).toBe(true);

      await provider.logout();
      expect(apiClient.getToken()).toBeNull();
    });
  });

  describe('Auth Factory', () => {
    it('returns configured provider and allows mock swapping', () => {
      const customMock = new MockAuthProvider();
      setAuthProvider(customMock);
      expect(getAuthProvider()).toBe(customMock);
    });
  });
});

