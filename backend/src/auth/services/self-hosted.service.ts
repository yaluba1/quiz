import * as crypto from 'crypto';
import argon2 from 'argon2';
import { eq, and, gt } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { signAccessToken, signRefreshToken, verifyToken } from '../jwt.js';
import {
  IAuthService,
  RegisterDto,
  RegisterResult,
  LoginDto,
  ResetPasswordDto,
  AuthResult,
  AuthTokens,
  SessionUser,
} from '../types.js';
import { getEmailService } from '../../email/email.service.js';

export class SelfHostedAuthService implements IAuthService {
  async register(dto: RegisterDto): Promise<RegisterResult> {
    const db = getDb();
    const normalizedEmail = dto.email.trim().toLowerCase();

    // Check if email already registered
    const existing = await db
      .select({ id: schema.professors.id })
      .from(schema.professors)
      .where(eq(schema.professors.email, normalizedEmail))
      .limit(1);

    if (existing.length > 0) {
      throw new Error('Email is already registered');
    }

    // Hash with Argon2id
    const passwordHash = await argon2.hash(dto.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    const displayName = (dto.displayName || (dto as any).name || '').trim();
    const locale = dto.locale || 'en';

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiresAt = new Date(Date.now() + 24 * 3600 * 1000); // 24 hours

    const [newProfessor] = await db
      .insert(schema.professors)
      .values({
        email: normalizedEmail,
        passwordHash,
        displayName,
        locale,
        emailVerified: false,
        verificationToken,
        verificationTokenExpiresAt,
      })
      .returning();

    // Send account verification email
    try {
      await getEmailService().sendVerificationEmail({
        to: newProfessor.email,
        displayName: newProfessor.displayName,
        token: verificationToken,
        locale: newProfessor.locale,
      });
    } catch (err) {
      console.error('Failed to dispatch verification email:', err);
    }

    return {
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      email: newProfessor.email,
      requiresVerification: true,
      verificationToken,
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const db = getDb();
    const normalizedEmail = dto.email.trim().toLowerCase();

    const [professor] = await db
      .select()
      .from(schema.professors)
      .where(eq(schema.professors.email, normalizedEmail))
      .limit(1);

    if (!professor) {
      throw new Error('Invalid email or password');
    }

    const passwordMatches = await argon2.verify(professor.passwordHash, dto.password);
    if (!passwordMatches) {
      throw new Error('Invalid email or password');
    }

    if (professor.emailVerified === false) {
      throw new Error('Account email is not verified. Please check your inbox for the verification link.');
    }

    const user: SessionUser = {
      id: professor.id,
      email: professor.email,
      displayName: professor.displayName,
      locale: professor.locale,
    };

    const { token: accessToken, expiresInSeconds } = signAccessToken(user);
    const refreshToken = signRefreshToken(user.id);

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: expiresInSeconds,
      },
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = verifyToken<{ sub: string; type: string }>(refreshToken);
      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const db = getDb();
      const [professor] = await db
        .select()
        .from(schema.professors)
        .where(eq(schema.professors.id, payload.sub))
        .limit(1);

      if (!professor) {
        throw new Error('User not found');
      }

      const user: SessionUser = {
        id: professor.id,
        email: professor.email,
        displayName: professor.displayName,
        locale: professor.locale,
      };

      const { token: accessToken, expiresInSeconds } = signAccessToken(user);
      const newRefreshToken = signRefreshToken(user.id);

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: expiresInSeconds,
      };
    } catch {
      throw new Error('Invalid or expired refresh token');
    }
  }

  async verifySession(accessToken: string): Promise<SessionUser> {
    try {
      const payload = verifyToken<{
        sub: string;
        email: string;
        displayName: string;
        locale: string;
        type: string;
      }>(accessToken);

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        id: payload.sub,
        email: payload.email,
        displayName: payload.displayName,
        locale: payload.locale,
      };
    } catch {
      throw new Error('Invalid or expired session');
    }
  }

  async verifyEmail(token: string): Promise<{ success: boolean; message: string }> {
    const db = getDb();
    const now = new Date();

    const [professor] = await db
      .select()
      .from(schema.professors)
      .where(
        and(
          eq(schema.professors.verificationToken, token),
          gt(schema.professors.verificationTokenExpiresAt, now)
        )
      )
      .limit(1);

    if (!professor) {
      throw new Error('Verification token is invalid or has expired');
    }

    await db
      .update(schema.professors)
      .set({
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.professors.id, professor.id));

    return {
      success: true,
      message: 'Email verified successfully. You can now sign in.',
    };
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; resetToken?: string }> {
    const db = getDb();
    const normalizedEmail = email.trim().toLowerCase();

    const [professor] = await db
      .select({ id: schema.professors.id, email: schema.professors.email, displayName: schema.professors.displayName, locale: schema.professors.locale })
      .from(schema.professors)
      .where(eq(schema.professors.email, normalizedEmail))
      .limit(1);

    if (!professor) {
      // Return success to avoid email enumeration attacks
      return { success: true };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    await db
      .update(schema.professors)
      .set({
        resetToken,
        resetTokenExpiresAt: resetExpires,
        updatedAt: new Date(),
      })
      .where(eq(schema.professors.id, professor.id));

    try {
      await getEmailService().sendPasswordResetEmail({
        to: professor.email || normalizedEmail,
        displayName: professor.displayName || 'Professor',
        token: resetToken,
        locale: professor.locale || 'en',
      });
    } catch (err) {
      console.error('Failed to dispatch password reset email:', err);
    }

    return { success: true, resetToken };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ success: boolean }> {
    const db = getDb();
    const now = new Date();

    const [professor] = await db
      .select()
      .from(schema.professors)
      .where(
        and(
          eq(schema.professors.resetToken, dto.token),
          gt(schema.professors.resetTokenExpiresAt, now)
        )
      )
      .limit(1);

    if (!professor) {
      throw new Error('Reset token is invalid or has expired');
    }

    const passwordHash = await argon2.hash(dto.newPassword, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    });

    await db
      .update(schema.professors)
      .set({
        passwordHash,
        resetToken: null,
        resetTokenExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.professors.id, professor.id));

    return { success: true };
  }
}

