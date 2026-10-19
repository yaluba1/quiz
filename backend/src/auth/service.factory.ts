import { config, AuthProviderType } from '../config/env.js';
import { IAuthService } from './types.js';
import { SelfHostedAuthService } from './services/self-hosted.service.js';
import { HankoAuthService } from './services/hanko.service.js';
import { SupabaseAuthService } from './services/supabase.service.js';

let authServiceInstance: IAuthService | null = null;

export function createAuthService(provider: AuthProviderType = config.auth.provider): IAuthService {
  switch (provider) {
    case 'hanko':
      return new HankoAuthService();
    case 'supabase':
      return new SupabaseAuthService();
    case 'self_hosted':
    default:
      return new SelfHostedAuthService();
  }
}

export function getAuthService(): IAuthService {
  if (!authServiceInstance) {
    authServiceInstance = createAuthService();
  }
  return authServiceInstance;
}

export function setAuthService(service: IAuthService | null): void {
  authServiceInstance = service;
}

