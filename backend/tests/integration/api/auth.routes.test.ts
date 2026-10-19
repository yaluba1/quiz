import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../../src/api/server.js';
import { setAuthService } from '../../../src/auth/service.factory.js';
import { IAuthService } from '../../../src/auth/types.js';
import { setupMockRedis } from '../../helpers/mock-redis.js';

describe('Auth Routes Integration', () => {
  let app: FastifyInstance;
  let mockAuthService: IAuthService;

  beforeAll(async () => {
    setupMockRedis();
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mockAuthService = {
      register: vi.fn().mockResolvedValue({
        success: true,
        message: 'Registration successful. Please check your email to verify your account.',
        email: 'prof@test.com',
        requiresVerification: true,
      }),
      verifyEmail: vi.fn().mockResolvedValue({
        success: true,
        message: 'Email verified successfully. You can now sign in.',
      }),
      login: vi.fn().mockResolvedValue({
        user: { id: 'prof-1', email: 'prof@test.com', displayName: 'Prof', locale: 'en' },
        tokens: { accessToken: 'valid_access_token', refreshToken: 'valid_refresh_token', expiresIn: 900 },
      }),
      refreshToken: vi.fn().mockResolvedValue({
        accessToken: 'new_access_token',
        refreshToken: 'new_refresh_token',
        expiresIn: 900,
      }),
      verifySession: vi.fn().mockResolvedValue({
        id: 'prof-1',
        email: 'prof@test.com',
        displayName: 'Prof',
        locale: 'en',
      }),
      requestPasswordReset: vi.fn().mockResolvedValue({ success: true, resetToken: 'reset_token_123' }),
      resetPassword: vi.fn().mockResolvedValue({ success: true }),
    };
    setAuthService(mockAuthService);
  });

  it('POST /api/auth/register successfully creates user and requires verification without session cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'new@test.com',
        password: 'secure_password_123',
        displayName: 'New Professor',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.requiresVerification).toBe(true);
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('POST /api/auth/register accepts name property as alias for displayName', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'new2@test.com',
        password: 'secure_password_123',
        name: 'New Professor 2',
      },
    });

    expect(res.statusCode).toBe(201);
    expect(mockAuthService.register).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new2@test.com',
        displayName: 'New Professor 2',
      })
    );
  });

  it('POST /api/auth/login successfully logs in user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'prof@test.com',
        password: 'secure_password_123',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBe('valid_access_token');
  });

  it('POST /api/auth/login returns 401 on bad credentials', async () => {
    mockAuthService.login = vi.fn().mockRejectedValue(new Error('Invalid email or password'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'wrong@test.com',
        password: 'wrong_password',
      },
    });

    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Unauthorized');
  });

  it('POST /api/auth/login returns 403 when email is not verified', async () => {
    mockAuthService.login = vi.fn().mockRejectedValue(new Error('Account email is not verified'));

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'unverified@test.com',
        password: 'correct_password',
      },
    });

    expect(res.statusCode).toBe(403);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Forbidden');
    expect(body.message).toContain('not verified');
  });

  it('POST and GET /api/auth/verify-email verifies token successfully', async () => {
    const postRes = await app.inject({
      method: 'POST',
      url: '/api/auth/verify-email',
      payload: {
        token: 'valid_verification_token_123',
      },
    });
    expect(postRes.statusCode).toBe(200);
    expect(JSON.parse(postRes.body).success).toBe(true);

    const getRes = await app.inject({
      method: 'GET',
      url: '/api/auth/verify-email?token=valid_verification_token_123',
    });
    expect(getRes.statusCode).toBe(200);
    expect(JSON.parse(getRes.body).success).toBe(true);
  });

  it('POST /api/auth/refresh rotates token via cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      cookies: {
        refreshToken: 'valid_refresh_token',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBe('new_access_token');
  });

  it('POST /api/auth/logout clears refresh cookie', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).success).toBe(true);
  });

  it('GET /api/auth/me returns current user profile when authorized', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: {
        authorization: 'Bearer valid_access_token',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.user.email).toBe('prof@test.com');
  });

  it('GET /api/auth/me returns 401 without Bearer header', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
    });

    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/forgot-password and /api/auth/reset-password', async () => {
    const forgotRes = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'prof@test.com' },
    });
    expect(forgotRes.statusCode).toBe(200);

    const resetRes = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: 'reset_token_123', newPassword: 'new_password_890' },
    });
    expect(resetRes.statusCode).toBe(200);
  });

  it('POST /api/auth/refresh returns 401 when no token is supplied', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {},
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/register returns 409 when registration fails', async () => {
    mockAuthService.register = vi.fn().mockRejectedValue(new Error('Email already registered'));
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'duplicate@test.com',
        password: 'password_1234',
        displayName: 'Dup',
      },
    });
    expect(res.statusCode).toBe(409);
  });

  it('POST /api/auth/reset-password returns 400 when token is invalid', async () => {
    mockAuthService.resetPassword = vi.fn().mockRejectedValue(new Error('Invalid or expired reset token'));
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/reset-password',
      payload: { token: 'bad_token', newPassword: 'new_password_123' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/refresh returns 401 when refreshToken verification fails', async () => {
    mockAuthService.refreshToken = vi.fn().mockRejectedValue(new Error('Invalid token'));
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: { refreshToken: 'invalid_token' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/auth/forgot-password returns 500 when service throws', async () => {
    mockAuthService.requestPasswordReset = vi.fn().mockRejectedValue(new Error('Database error'));
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/forgot-password',
      payload: { email: 'bad@test.com' },
    });
    expect(res.statusCode).toBe(500);
  });
});

