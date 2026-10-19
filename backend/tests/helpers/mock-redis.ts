import RedisMock from 'ioredis-mock';
import { setRedisClient } from '../../src/redis/client.js';

export function setupMockRedis(): any {
  const mockRedis = new RedisMock();
  setRedisClient(mockRedis as any);
  return mockRedis;
}

