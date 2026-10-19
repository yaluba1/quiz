import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { getPool } from '../../db/index.js';
import { getRedisClient } from '../../redis/client.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // Liveness probe
  app.get(
    '/healthz',
    {
      schema: {
        tags: ['Health'],
        summary: 'Liveness health check probe',
        description: 'Lightweight liveness probe for Docker/Kubernetes container monitoring',
        response: {
          200: Type.Object({
            status: Type.String(),
          }),
        },
      },
    },
    async (_request, reply) => {
      return reply.status(200).send({ status: 'ok' });
    }
  );

  app.get(
    '/api/healthz',
    {
      schema: {
        tags: ['Health'],
        summary: 'Liveness health check probe under /api prefix',
        response: {
          200: Type.Object({
            status: Type.String(),
          }),
        },
      },
    },
    async (_request, reply) => {
      return reply.status(200).send({ status: 'ok' });
    }
  );

  // Deep readiness probe
  app.get(
    '/api/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Readiness deep health check probe',
        description: 'Checks connectivity to PostgreSQL database and Redis store',
        response: {
          200: Type.Object({
            status: Type.String(),
            database: Type.String(),
            redis: Type.String(),
            uptimeSeconds: Type.Number(),
            timestamp: Type.String(),
          }),
          503: Type.Object({
            status: Type.String(),
            database: Type.String(),
            redis: Type.String(),
            error: Type.String(),
            timestamp: Type.String(),
          }),
        },
      },
    },
    async (_request, reply) => {
      let dbStatus = 'healthy';
      let redisStatus = 'healthy';
      let hasError = false;
      let errorMsg = '';

      try {
        const pool = getPool();
        await pool.query('SELECT 1');
      } catch (err: any) {
        dbStatus = 'unreachable';
        hasError = true;
        errorMsg += `DB error: ${err.message}; `;
      }

      try {
        const redis = getRedisClient();
        await redis.ping();
      } catch (err: any) {
        redisStatus = 'unreachable';
        hasError = true;
        errorMsg += `Redis error: ${err.message}; `;
      }

      const responsePayload = {
        status: hasError ? 'degraded' : 'healthy',
        database: dbStatus,
        redis: redisStatus,
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString(),
      };

      if (hasError) {
        return reply.status(503).send({ ...responsePayload, error: errorMsg.trim() });
      }

      return reply.status(200).send(responsePayload);
    }
  );
}

