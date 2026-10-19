import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { SupabaseAuthService } from '../../../src/auth/services/supabase.service.js';
import * as dbModule from '../../../src/db/index.js';

describe('SupabaseAuthService', () => {
  const service = new SupabaseAuthService();

  it('rejects direct register with helpful message', async () => {
    await expect(
      service.register({ email: 'test@example.com', password: 'pwd', displayName: 'Test' })
    ).rejects.toThrow('Registration should be completed directly via Supabase Auth client');
  });

  it('rejects direct login with helpful message', async () => {
    await expect(
      service.login({ email: 'test@example.com', password: 'pwd' })
    ).rejects.toThrow('Login should be completed directly via Supabase Auth client');
  });

  it('verifies valid Supabase JWT and resolves SessionUser', async () => {
    const supabasePayload = {
      sub: 'supabase-user-uuid-1234',
      email: 'teacher@school.edu',
      user_metadata: { display_name: 'Prof. Gauss' },
    };
    const token = jwt.sign(supabasePayload, 'dummy_secret');

    // Mock DB getDb()
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: 'internal-prof-uuid',
          email: 'teacher@school.edu',
          displayName: 'Prof. Gauss',
          locale: 'en',
        },
      ]),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const user = await service.verifySession(token);
    expect(user.email).toBe('teacher@school.edu');
    expect(user.displayName).toBe('Prof. Gauss');
  });

  it('throws on invalid token', async () => {
    await expect(service.verifySession('invalid.token.here')).rejects.toThrow(
      'Invalid Supabase session'
    );
  });

  it('auto-provisions professor if not already present in database', async () => {
    const supabasePayload = {
      sub: 'supabase-user-uuid-9999',
      email: 'newprof@school.edu',
    };
    const token = jwt.sign(supabasePayload, 'dummy_secret');

    const created = {
      id: 'new-prof-uuid',
      email: 'newprof@school.edu',
      displayName: 'newprof',
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
    expect(user.id).toBe('new-prof-uuid');
    expect(user.email).toBe('newprof@school.edu');
  });

  it('rejects password reset and refresh with descriptive error', async () => {
    await expect(service.requestPasswordReset('prof@test.com')).rejects.toThrow('managed by Supabase Auth');
    await expect(service.resetPassword({ token: 'tok', newPassword: 'pwd' })).rejects.toThrow('managed by Supabase Auth');
    await expect(service.refreshToken('refresh_token')).rejects.toThrow('Invalid Supabase session');
  });
});

