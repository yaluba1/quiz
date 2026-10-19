import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fastify, { FastifyInstance } from 'fastify';
import { setupErrorHandler } from '../../../src/api/plugins/error-handler.js';

describe('Error Handler Plugin Unit Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = fastify();
    setupErrorHandler(app);

    app.get('/test-error', async () => {
      const err: any = new Error('Custom boom error');
      err.statusCode = 400;
      throw err;
    });

    app.get('/test-500', async () => {
      throw new Error('Internal boom');
    });

    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('handles 400 custom status code errors', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test-error',
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Error');
    expect(body.message).toBe('Custom boom error');
    expect(body.timestamp).toBeDefined();
  });

  it('handles 500 unhandled errors', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/test-500',
    });

    expect(res.statusCode).toBe(500);
    const body = JSON.parse(res.body);
    expect(body.statusCode).toBe(500);
    expect(body.message).toBe('Internal boom');
  });

  it('handles 404 not found routes', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/non-existent-route',
    });

    expect(res.statusCode).toBe(404);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('NotFound');
  });
});

