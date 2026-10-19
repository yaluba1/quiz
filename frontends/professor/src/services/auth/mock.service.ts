import { IAuthProvider, AuthUser, AuthTokens, RegisterResponse } from '../../types/auth';

export class MockAuthProvider implements IAuthProvider {
  private currentUser: AuthUser | null = {
    id: 'mock-prof-id',
    email: 'professor@example.com',
    name: 'Professor Mock',
  };

  async login(credentials: { email: string; password: string }): Promise<{ user: AuthUser; tokens: AuthTokens }> {
    if (credentials.password === 'wrong-password') {
      throw new Error('Invalid email or password');
    }
    this.currentUser = {
      id: 'mock-prof-id',
      email: credentials.email,
      name: 'Professor Mock',
    };
    return {
      user: this.currentUser,
      tokens: { accessToken: 'mock-jwt-token', expiresIn: 3600 },
    };
  }

  async register(data: { email: string; password: string; name?: string; displayName?: string; locale?: string }): Promise<RegisterResponse> {
    const displayName = data.displayName || data.name || 'Professor Mock';
    this.currentUser = {
      id: 'mock-prof-id',
      email: data.email,
      name: displayName,
      displayName,
    };
    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      email: data.email,
      requiresVerification: true,
      user: this.currentUser,
      tokens: { accessToken: 'mock-jwt-token', expiresIn: 3600 },
    };
  }

  async verifyEmail(_token: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Email verified successfully. You can now sign in.' };
  }

  async logout(): Promise<void> {
    this.currentUser = null;
  }

  async getUser(): Promise<AuthUser | null> {
    return this.currentUser;
  }

  async refreshToken(): Promise<AuthTokens | null> {
    return { accessToken: 'mock-refreshed-jwt-token', expiresIn: 3600 };
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; resetToken?: string }> {
    return {
      success: true,
      message: 'Reset email sent',
      resetToken: 'mock-reset-token-123',
    };
  }

  async resetPassword(_data: { token: string; newPassword: string }): Promise<{ success: boolean }> {
    return { success: true };
  }
}

