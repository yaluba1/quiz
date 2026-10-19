import jwt, { SignOptions } from 'jsonwebtoken';
import { config } from '../config/env.js';
import { SessionUser } from './types.js';

export interface TokenPayload {
  sub: string;
  email: string;
  displayName: string;
  locale: string;
  type: 'access' | 'refresh';
}

export function signAccessToken(user: SessionUser): { token: string; expiresInSeconds: number } {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    locale: user.locale,
    type: 'access',
  };

  const options: SignOptions = {
    expiresIn: config.auth.accessExpiresIn as SignOptions['expiresIn'],
  };

  const token = jwt.sign(payload, config.auth.jwtSecret, options);
  // Default 15 minutes = 900 seconds
  const expiresInSeconds = 900;
  return { token, expiresInSeconds };
}

export function signRefreshToken(userId: string): string {
  const payload = {
    sub: userId,
    type: 'refresh',
  };

  const options: SignOptions = {
    expiresIn: config.auth.refreshExpiresIn as SignOptions['expiresIn'],
  };

  return jwt.sign(payload, config.auth.jwtSecret, options);
}

export function verifyToken<T = TokenPayload>(token: string): T {
  return jwt.verify(token, config.auth.jwtSecret) as T;
}

