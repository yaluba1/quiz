import { describe, it, expect } from 'vitest';
import {
  getRedisOptions,
  setRedisClient,
  getRedisClient,
  closeRedis,
} from '../../../src/redis/client.js';

describe('Redis Client Manager Unit Tests', () => {
  it('returns valid redis options with defaults', () => {
    const opts = getRedisOptions({ db: 2 });
    expect(opts.db).toBe(2);
    expect(opts.lazyConnect).toBe(true);
  });

  it('sets and retrieves custom redis client', () => {
    const customMock: any = { status: 'mocked' };
    setRedisClient(customMock);
    expect(getRedisClient()).toBe(customMock);
  });

  it('closes redis clients gracefully', async () => {
    const mockClient: any = { quit: async () => {}, disconnect: () => {} };
    setRedisClient(mockClient);
    await closeRedis();
  });

  it('creates and returns pub/sub clients and handles quit failures with disconnect fallback', async () => {
    const pubMock: any = {
      quit: vi.fn().mockRejectedValue(new Error('Connection lost')),
      disconnect: vi.fn(),
    };

    setRedisClient(pubMock);
    await closeRedis();
    expect(pubMock.disconnect).toHaveBeenCalled();
  });

  it('instantiates clients via createRedisClient and getPubSubClients', async () => {
    const { createRedisClient, getPubSubClients } = await import('../../../src/redis/client.js');
    const client = createRedisClient();
    expect(client).toBeDefined();
    client.disconnect();

    const { pubClient, subClient } = getPubSubClients();
    expect(pubClient).toBeDefined();
    expect(subClient).toBeDefined();
    pubClient.disconnect();
    subClient.disconnect();
    await closeRedis();
  });
});

