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
 * Supabase Auth Provider Adapter.
 * Integrates external Supabase Auth tokens with the Open Quiz professor session.
 */
export class SupabaseAuthService implements IAuthService {
  private jwtSecret?: string;

  constructor() {
    this.jwtSecret = config.auth.supabaseJwtSecret;
  }

  async register(_dto: RegisterDto): Promise<any> {
    throw new Error('Registration should be completed directly via Supabase Auth client');
  }

  async verifyEmail(_token: string): Promise<{ success: boolean; message: string }> {
    return { success: true, message: 'Supabase handles verification automatically' };
  }

  async login(_dto: LoginDto): Promise<AuthResult> {
    throw new Error('Login should be completed directly via Supabase Auth client');
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
      let payload: { sub?: string; email?: string; user_metadata?: { display_name?: string } };

      if (this.jwtSecret) {
        payload = jwt.verify(accessToken, this.jwtSecret) as typeof payload;
      } else {
        payload = jwt.decode(accessToken) as typeof payload;
      }

      if (!payload || !payload.sub || !payload.email) {
        throw new Error('Invalid Supabase token payload');
      }

      const email = payload.email.trim().toLowerCase();
      const displayName = payload.user_metadata?.display_name || email.split('@')[0];
      const db = getDb();

      // Find or upsert professor record matching Supabase user email
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
            passwordHash: 'SUPABASE_EXTERNAL_AUTH',
            displayName,
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
      throw new Error('Invalid Supabase session');
    }
  }

  async requestPasswordReset(_email: string): Promise<{ success: boolean; resetToken?: string }> {
    throw new Error('Password reset is managed by Supabase Auth');
  }

  async resetPassword(_dto: ResetPasswordDto): Promise<{ success: boolean }> {
    throw new Error('Password reset is managed by Supabase Auth');
  }
}

