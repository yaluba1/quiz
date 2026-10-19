import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { HankoAuthService } from '../../../src/auth/services/hanko.service.js';
import * as dbModule from '../../../src/db/index.js';

describe('HankoAuthService', () => {
  const service = new HankoAuthService();

  it('rejects direct register with helpful message', async () => {
    await expect(
      service.register({ email: 'test@example.com', password: 'pwd', displayName: 'Test' })
    ).rejects.toThrow('Registration should be completed directly via Hanko WebAuthn widget');
  });

  it('verifies Hanko session token and maps user', async () => {
    const hankoPayload = {
      sub: 'hanko-user-uuid',
      email: 'hanko.teacher@school.edu',
    };
    const token = jwt.sign(hankoPayload, 'test_secret');

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: 'internal-prof-uuid',
          email: 'hanko.teacher@school.edu',
          displayName: 'hanko.teacher',
          locale: 'en',
        },
      ]),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const user = await service.verifySession(token);
    expect(user.email).toBe('hanko.teacher@school.edu');
  });

  it('throws on invalid token', async () => {
    await expect(service.verifySession('garbage')).rejects.toThrow('Invalid Hanko session');
  });

  it('rejects direct login with helpful message', async () => {
    await expect(
      service.login({ email: 'test@example.com', password: 'pwd' })
    ).rejects.toThrow('Login should be completed directly via Hanko WebAuthn widget');
  });

  it('auto-provisions professor if not already present in database', async () => {
    const hankoPayload = {
      sub: 'hanko-new-user-uuid',
      email: 'newhanko@school.edu',
    };
    const token = jwt.sign(hankoPayload, 'test_secret');

    const created = {
      id: 'new-hanko-prof-uuid',
      email: 'newhanko@school.edu',
      displayName: 'newhanko',
      locale: 'en',
    };

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]), // Not found
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([created]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const user = await service.verifySession(token);
    expect(user.id).toBe('new-hanko-prof-uuid');
    expect(user.email).toBe('newhanko@school.edu');
  });

  it('rejects password reset and refresh with descriptive error', async () => {
    await expect(service.requestPasswordReset('prof@test.com')).rejects.toThrow('Passkey dashboard');
    await expect(service.resetPassword({ token: 'tok', newPassword: 'pwd' })).rejects.toThrow('Passkey dashboard');
    await expect(service.refreshToken('refresh_token')).rejects.toThrow('Invalid Hanko session');
  });
});

