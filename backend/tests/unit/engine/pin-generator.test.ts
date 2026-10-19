import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockRedis } from '../../helpers/mock-redis.js';
import {
  generateRandomPin,
  allocateUniquePin,
} from '../../../src/engine/state/pin-generator.js';

describe('PIN Generator', () => {
  beforeEach(() => {
    setupMockRedis();
  });

  it('generates a 6-digit numeric string between 100000 and 999999', () => {
    for (let i = 0; i < 50; i++) {
      const pin = generateRandomPin();
      expect(pin).toHaveLength(6);
      const num = parseInt(pin, 10);
      expect(num).toBeGreaterThanOrEqual(100000);
      expect(num).toBeLessThanOrEqual(999999);
      expect(/^\d{6}$/.test(pin)).toBe(true);
    }
  });

  it('allocates a unique PIN when not colliding', async () => {
    const pin = await allocateUniquePin();
    expect(pin).toHaveLength(6);
    expect(/^\d{6}$/.test(pin)).toBe(true);
  });

  it('falls back to timestamp offset when collisions exceed max attempts', async () => {
    const { getRedisClient } = await import('../../../src/redis/client.js');
    const redis = getRedisClient();
    vi.spyOn(redis, 'exists').mockResolvedValue(1 as any);

    const pin = await allocateUniquePin(3);
    expect(pin).toHaveLength(6);
    expect(/^\d{6}$/.test(pin)).toBe(true);
  });
});

