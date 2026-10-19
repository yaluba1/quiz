export interface AuthUser {
  id: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
  role?: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn?: number;
  refreshToken?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  email: string;
  requiresVerification: boolean;
  user?: AuthUser;
  tokens?: AuthTokens;
}

export interface IAuthProvider {
  login(credentials: { email: string; password: string }): Promise<{ user: AuthUser; tokens: AuthTokens }>;
  register(data: { email: string; password: string; name?: string; displayName?: string; locale?: string }): Promise<RegisterResponse>;
  verifyEmail(token: string): Promise<{ success: boolean; message: string }>;
  logout(): Promise<void>;
  getUser(): Promise<AuthUser | null>;
  refreshToken(): Promise<AuthTokens | null>;
  requestPasswordReset(email: string): Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPassword(data: { token: string; newPassword: string }): Promise<{ success: boolean }>;
}

