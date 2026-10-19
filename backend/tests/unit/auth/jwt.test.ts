import { describe, it, expect } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from '../../../src/auth/jwt.js';

describe('JWT Utilities', () => {
  const dummyUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'professor@example.com',
    displayName: 'Dr. Turing',
    locale: 'en',
  };

  it('signs and verifies access token with correct payload', () => {
    const { token, expiresInSeconds } = signAccessToken(dummyUser);
    expect(token).toBeDefined();
    expect(expiresInSeconds).toBe(900);

    const payload = verifyToken<any>(token);
    expect(payload.sub).toBe(dummyUser.id);
    expect(payload.email).toBe(dummyUser.email);
    expect(payload.displayName).toBe(dummyUser.displayName);
    expect(payload.locale).toBe(dummyUser.locale);
    expect(payload.type).toBe('access');
  });

  it('signs and verifies refresh token with correct type', () => {
    const refreshToken = signRefreshToken(dummyUser.id);
    expect(refreshToken).toBeDefined();

    const payload = verifyToken<any>(refreshToken);
    expect(payload.sub).toBe(dummyUser.id);
    expect(payload.type).toBe('refresh');
  });

  it('throws error when verifying tampered token', () => {
    const { token } = signAccessToken(dummyUser);
    const tampered = token.slice(0, -5) + 'abcde';

    expect(() => verifyToken(tampered)).toThrow();
  });

  it('throws error on garbage string', () => {
    expect(() => verifyToken('not.a.valid.jwt')).toThrow();
  });
});

