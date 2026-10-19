import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../../src/api/server.js';
import { setupMockRedis } from '../../helpers/mock-redis.js';

describe('Health Routes Integration', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    setupMockRedis();
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /healthz returns 200 and status ok', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
  });

  it('GET /api/health returns 200 when database and redis are healthy', async () => {
    const { getPool } = await import('../../../src/db/index.js');
    const { getRedisClient } = await import('../../../src/redis/client.js');
    const pool = getPool();
    vi.spyOn(pool, 'query').mockResolvedValue({ rows: [1] } as any);
    const redis = getRedisClient();
    vi.spyOn(redis, 'ping').mockResolvedValue('PONG');

    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
    expect(body.database).toBe('healthy');
    expect(body.redis).toBe('healthy');
  });

  it('GET /api/health returns 503 when redis or database is unreachable', async () => {
    const { getRedisClient } = await import('../../../src/redis/client.js');
    const redis = getRedisClient();
    vi.spyOn(redis, 'ping').mockRejectedValue(new Error('Redis connection timed out'));

    const res = await app.inject({
      method: 'GET',
      url: '/api/health',
    });

    expect(res.statusCode).toBe(503);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('degraded');
    expect(body.redis).toBe('unreachable');
  });
});

