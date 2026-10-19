import { IAuthProvider } from '../../types/auth';
import { SelfHostedAuthProvider } from './self-hosted.service';
import { MockAuthProvider } from './mock.service';

let authProviderInstance: IAuthProvider | null = null;

export function getAuthProvider(): IAuthProvider {
  if (authProviderInstance) {
    return authProviderInstance;
  }

  const providerType = process.env.NEXT_PUBLIC_AUTH_PROVIDER || 'self_hosted';

  switch (providerType) {
    case 'mock':
      authProviderInstance = new MockAuthProvider();
      break;
    case 'self_hosted':
    default:
      authProviderInstance = new SelfHostedAuthProvider();
      break;
  }

  return authProviderInstance;
}

export function setAuthProvider(provider: IAuthProvider): void {
  authProviderInstance = provider;
}

