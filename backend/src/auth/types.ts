export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  locale: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
  locale?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthResult {
  user: SessionUser;
  tokens: AuthTokens;
}

export interface RegisterResult {
  success: boolean;
  message: string;
  email: string;
  requiresVerification: boolean;
  verificationToken?: string;
}

export interface IAuthService {
  register(dto: RegisterDto): Promise<RegisterResult>;
  login(dto: LoginDto): Promise<AuthResult>;
  verifyEmail(token: string): Promise<{ success: boolean; message: string }>;
  refreshToken(refreshToken: string): Promise<AuthTokens>;
  verifySession(accessToken: string): Promise<SessionUser>;
  requestPasswordReset(email: string): Promise<{ success: boolean; resetToken?: string }>;
  resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean }>;
}

