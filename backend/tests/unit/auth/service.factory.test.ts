import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAuthService,
  getAuthService,
  setAuthService,
} from '../../../src/auth/service.factory.js';
import { SelfHostedAuthService } from '../../../src/auth/services/self-hosted.service.js';
import { HankoAuthService } from '../../../src/auth/services/hanko.service.js';
import { SupabaseAuthService } from '../../../src/auth/services/supabase.service.js';

describe('Auth Service Factory', () => {
  beforeEach(() => {
    setAuthService(null);
  });

  it('creates SelfHostedAuthService by default', () => {
    const service = createAuthService('self_hosted');
    expect(service).toBeInstanceOf(SelfHostedAuthService);
  });

  it('creates HankoAuthService when provider is hanko', () => {
    const service = createAuthService('hanko');
    expect(service).toBeInstanceOf(HankoAuthService);
  });

  it('creates SupabaseAuthService when provider is supabase', () => {
    const service = createAuthService('supabase');
    expect(service).toBeInstanceOf(SupabaseAuthService);
  });

  it('returns singleton instance from getAuthService', () => {
    const s1 = getAuthService();
    const s2 = getAuthService();
    expect(s1).toBe(s2);
  });

  it('allows overriding auth service instance via setAuthService', () => {
    const mockService: any = { verifySession: () => {} };
    setAuthService(mockService);
    expect(getAuthService()).toBe(mockService);
  });
});

