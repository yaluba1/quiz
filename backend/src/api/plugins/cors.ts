import { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { config } from '../../config/env.js';

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });
}

