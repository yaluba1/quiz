import { describe, it, expect, vi, beforeEach } from 'vitest';
import argon2 from 'argon2';
import { SelfHostedAuthService } from '../../../src/auth/services/self-hosted.service.js';
import * as dbModule from '../../../src/db/index.js';
import { signRefreshToken, signAccessToken } from '../../../src/auth/jwt.js';

describe('SelfHostedAuthService Unit Tests', () => {
  let service: SelfHostedAuthService;

  beforeEach(() => {
    service = new SelfHostedAuthService();
  });

  it('registers new professor successfully', async () => {
    const dummyProf = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'newprof@test.com',
      displayName: 'Prof Test',
      locale: 'en',
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]), // no existing user
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([dummyProf]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const result = await service.register({
      email: 'newprof@test.com',
      password: 'password123',
      displayName: 'Prof Test',
    });

    expect(result.success).toBe(true);
    expect(result.requiresVerification).toBe(true);
    expect(result.email).toBe('newprof@test.com');
    expect(result.verificationToken).toBeDefined();
  });

  it('rejects registration with existing email', async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'existing-id' }]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    await expect(
      service.register({
        email: 'exists@test.com',
        password: 'password123',
        displayName: 'Prof',
      })
    ).rejects.toThrow('Email is already registered');
  });

  it('logs in professor with correct password and verified email', async () => {
    const passwordHash = await argon2.hash('correct_password', { type: argon2.argon2id });
    const dummyProf = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'prof@test.com',
      displayName: 'Prof',
      locale: 'en',
      emailVerified: true,
      passwordHash,
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dummyProf]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const result = await service.login({
      email: 'prof@test.com',
      password: 'correct_password',
    });

    expect(result.user.id).toBe(dummyProf.id);
    expect(result.tokens.accessToken).toBeDefined();
  });

  it('rejects login when email is not verified', async () => {
    const passwordHash = await argon2.hash('correct_password', { type: argon2.argon2id });
    const dummyProf = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'prof@test.com',
      displayName: 'Prof',
      locale: 'en',
      emailVerified: false,
      passwordHash,
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dummyProf]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    await expect(
      service.login({
        email: 'prof@test.com',
        password: 'correct_password',
      })
    ).rejects.toThrow('Account email is not verified');
  });

  it('verifies email with valid token and rejects expired/invalid token', async () => {
    const dummyProf = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'prof@test.com',
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dummyProf]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const result = await service.verifyEmail('valid_verification_token');
    expect(result.success).toBe(true);

    mockDb.select = vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([]),
        }),
      }),
    });

    await expect(service.verifyEmail('invalid_token')).rejects.toThrow('Verification token is invalid');
  });

  it('rejects login with wrong password', async () => {
    const passwordHash = await argon2.hash('correct_password', { type: argon2.argon2id });
    const dummyProf = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'prof@test.com',
      passwordHash,
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dummyProf]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    await expect(
      service.login({
        email: 'prof@test.com',
        password: 'wrong_password',
      })
    ).rejects.toThrow('Invalid email or password');
  });

  it('refreshes token successfully', async () => {
    const profId = '00000000-0000-0000-0000-000000000001';
    const refreshToken = signRefreshToken(profId);
    const dummyProf = {
      id: profId,
      email: 'prof@test.com',
      displayName: 'Prof',
      locale: 'en',
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dummyProf]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const tokens = await service.refreshToken(refreshToken);
    expect(tokens.accessToken).toBeDefined();
    expect(tokens.refreshToken).toBeDefined();
  });

  it('verifies session with access token', async () => {
    const user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'prof@test.com',
      displayName: 'Prof',
      locale: 'en',
    };
    const { token } = signAccessToken(user);

    const verified = await service.verifySession(token);
    expect(verified.id).toBe(user.id);
    expect(verified.email).toBe(user.email);
  });

  it('requests password reset and generates token', async () => {
    const dummyProf = { id: '00000000-0000-0000-0000-000000000001' };
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dummyProf]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const result = await service.requestPasswordReset('prof@test.com');
    expect(result.success).toBe(true);
    expect(result.resetToken).toBeDefined();
  });

  it('resets password with valid token', async () => {
    const dummyProf = { id: '00000000-0000-0000-0000-000000000001' };
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([dummyProf]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const result = await service.resetPassword({
      token: 'valid_token',
      newPassword: 'new_super_password',
    });
    expect(result.success).toBe(true);
  });

  it('requestPasswordReset returns success without token when email is not found', async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const result = await service.requestPasswordReset('nonexistent@test.com');
    expect(result.success).toBe(true);
    expect(result.resetToken).toBeUndefined();
  });

  it('resetPassword throws error when token is invalid or expired', async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    await expect(
      service.resetPassword({
        token: 'expired_token',
        newPassword: 'new_super_password',
      })
    ).rejects.toThrow('Reset token is invalid or has expired');
  });

  it('refreshToken throws error when token is invalid', async () => {
    await expect(service.refreshToken('invalid_jwt_token')).rejects.toThrow();
  });

  it('verifySession throws error when token is invalid', async () => {
    await expect(service.verifySession('invalid_jwt_token')).rejects.toThrow();
  });
});

