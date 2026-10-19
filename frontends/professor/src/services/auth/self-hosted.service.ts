import { IAuthProvider, AuthUser, AuthTokens, RegisterResponse } from '../../types/auth';
import { apiClient } from '../../lib/api-client';

export class SelfHostedAuthProvider implements IAuthProvider {
  async login(credentials: { email: string; password: string }): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    const data = await apiClient.request<{ user: AuthUser; accessToken: string; expiresIn?: number }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    apiClient.setToken(data.accessToken);
    const user: AuthUser = {
      ...data.user,
      name: (data.user as any)?.displayName || data.user.name,
      displayName: (data.user as any)?.displayName || data.user.name,
    };
    return {
      user,
      tokens: { accessToken: data.accessToken, expiresIn: data.expiresIn },
    };
  }

  async register(data: { email: string; password: string; name?: string; displayName?: string; locale?: string }): Promise<RegisterResponse> {
    const displayName = (data.displayName || data.name || data.email.split('@')[0] || 'Professor').trim();
    const res = await apiClient.request<{
      success?: boolean;
      message?: string;
      email?: string;
      requiresVerification?: boolean;
      user?: AuthUser;
      accessToken?: string;
      expiresIn?: number;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
        password: data.password,
        displayName,
        locale: data.locale || 'en',
      }),
    });

    if (res.accessToken) {
      apiClient.setToken(res.accessToken);
    }

    const user: AuthUser | undefined = res.user
      ? {
          ...res.user,
          name: (res.user as any)?.displayName || res.user.name,
          displayName: (res.user as any)?.displayName || res.user.name,
        }
      : undefined;

    return {
      success: res.success ?? true,
      message: res.message || 'Registration successful. Please check your email to verify your account.',
      email: res.email || data.email,
      requiresVerification: res.requiresVerification ?? true,
      user,
      tokens: res.accessToken
        ? { accessToken: res.accessToken, expiresIn: res.expiresIn }
        : undefined,
    };
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    return apiClient.request<{ success: boolean; message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async logout(): Promise<void> {
    try {
      await apiClient.request<{ success: boolean }>('/auth/logout', {
        method: 'POST',
      });
    } catch {
      // ignore
    } finally {
      apiClient.setToken(null);
    }
  }

  async getUser(): Promise<AuthUser | null> {
    const token = apiClient.getToken();
    if (!token) return null;

    try {
      const data = await apiClient.request<{ user: AuthUser }>('/auth/me', {
        method: 'GET',
      });
      return {
        ...data.user,
        name: (data.user as any)?.displayName || data.user.name,
        displayName: (data.user as any)?.displayName || data.user.name,
      };
    } catch {
      apiClient.setToken(null);
      return null;
    }
  }

  async refreshToken(): Promise<AuthTokens | null> {
    try {
      const data = await apiClient.request<{ accessToken: string; expiresIn?: number }>('/auth/refresh', {
        method: 'POST',
      });
      apiClient.setToken(data.accessToken);
      return { accessToken: data.accessToken, expiresIn: data.expiresIn };
    } catch {
      apiClient.setToken(null);
      return null;
    }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
    return apiClient.request<{ success: boolean; message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(data: { token: string; newPassword: string }): Promise<{ success: boolean }> {
    return apiClient.request<{ success: boolean }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: data.token, newPassword: data.newPassword }),
    });
  }
}

