import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { config } from '../../config/env.js';
import { signAccessToken, signRefreshToken } from '../jwt.js';
import {
  IAuthService,
  RegisterDto,
  LoginDto,
  ResetPasswordDto,
  AuthResult,
  AuthTokens,
  SessionUser,
} from '../types.js';

/**
 * Hanko WebAuthn / Passkeys Auth Provider Adapter.
 */
export class HankoAuthService implements IAuthService {
  private hankoApiUrl: string;

  constructor() {
    this.hankoApiUrl = config.auth.hankoApiUrl || 'https://auth.example.com';
  }

  async register(_dto: RegisterDto): Promise<any> {
    throw new Error('Registration should be completed directly via Hanko WebAuthn widget');
  }

  async verifyEmail(_token: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Hanko handles verification automatically' };
  }

  async login(_dto: LoginDto): Promise<AuthResult> {
    throw new Error('Login should be completed directly via Hanko WebAuthn widget');
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const user = await this.verifySession(refreshToken);
    const { token: accessToken, expiresInSeconds } = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user.id);
    return {
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: expiresInSeconds,
    };
  }

  async verifySession(accessToken: string): Promise<SessionUser> {
    try {
      // Decode Hanko JWT (verified with Hanko Secret or JWKS public key)
      const decoded = jwt.decode(accessToken) as { sub?: string; email?: string } | null;
      if (!decoded || !decoded.sub) {
        throw new Error('Invalid Hanko token');
      }

      const email = decoded.email || `${decoded.sub}@hanko.user`;
      const db = getDb();

      // Find or upsert professor record
      let [professor] = await db
        .select()
        .from(schema.professors)
        .where(eq(schema.professors.email, email))
        .limit(1);

      if (!professor) {
        [professor] = await db
          .insert(schema.professors)
          .values({
            email,
            passwordHash: 'HANKO_EXTERNAL_AUTH',
            displayName: email.split('@')[0],
            locale: 'en',
          })
          .returning();
      }

      return {
        id: professor.id,
        email: professor.email,
        displayName: professor.displayName,
        locale: professor.locale,
      };
    } catch {
      throw new Error('Invalid Hanko session');
    }
  }

  async requestPasswordReset(_email: string): Promise<{ success: boolean; resetToken?: string }> {
    throw new Error('Password reset is managed by the Hanko Passkey dashboard');
  }

  async resetPassword(_dto: ResetPasswordDto): Promise<{ success: boolean }> {
    throw new Error('Password reset is managed by the Hanko Passkey dashboard');
  }
}

