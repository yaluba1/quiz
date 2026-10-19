import { describe, it, expect, vi } from 'vitest';
import { authenticateProfessor } from '../../../src/auth/middleware.js';
import { setAuthService } from '../../../src/auth/service.factory.js';

describe('Auth Middleware Unit Tests', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const req: any = { headers: {} };
    const reply: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await authenticateProfessor(req, reply);
    expect(reply.status).toHaveBeenCalledWith(401);
  });

  it('returns 401 when Authorization header does not start with Bearer', async () => {
    const req: any = { headers: { authorization: 'Basic 1234' } };
    const reply: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await authenticateProfessor(req, reply);
    expect(reply.status).toHaveBeenCalledWith(401);
  });

  it('sets request.user on valid token verification', async () => {
    const mockUser = { id: 'user-1', email: 'test@test.com', displayName: 'Prof', locale: 'en' };
    setAuthService({
      register: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
      verifySession: vi.fn().mockResolvedValue(mockUser),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    });

    const req: any = { headers: { authorization: 'Bearer valid-jwt' } };
    const reply: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await authenticateProfessor(req, reply);
    expect(req.user).toEqual(mockUser);
  });

  it('returns 401 when verifySession throws', async () => {
    setAuthService({
      register: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
      verifySession: vi.fn().mockRejectedValue(new Error('Token signature invalid')),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    });

    const req: any = { headers: { authorization: 'Bearer bad-jwt' } };
    const reply: any = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };

    await authenticateProfessor(req, reply);
    expect(reply.status).toHaveBeenCalledWith(401);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Token signature invalid' })
    );
  });
});

