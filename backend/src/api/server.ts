import fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { registerSwagger } from './plugins/swagger.js';
import { registerCors } from './plugins/cors.js';
import { setupErrorHandler } from './plugins/error-handler.js';
import { healthRoutes } from './routes/health.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { quizzesRoutes } from './routes/quizzes.routes.js';
import { questionsRoutes } from './routes/questions.routes.js';
import { themesRoutes } from './routes/themes.routes.js';
import { sessionsRoutes } from './routes/sessions.routes.js';
import { mediaRoutes } from './routes/media.routes.js';

export async function createServer(): Promise<FastifyInstance> {
  const isTest = process.env.NODE_ENV === 'test';

  const app = fastify({
    logger: isTest ? false : { level: process.env.LOG_LEVEL || 'info' },
    disableRequestLogging: isTest,
  });

  // Cookies & Multipart
  await app.register(cookie);
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit to support short video & audio
    },
  });

  // Plugins
  await registerCors(app);
  await registerSwagger(app);
  setupErrorHandler(app);

  // Routes
  await app.register(healthRoutes);
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(quizzesRoutes, { prefix: '/api/quizzes' });
  await app.register(questionsRoutes, { prefix: '/api' });
  await app.register(themesRoutes, { prefix: '/api/themes' });
  await app.register(sessionsRoutes, { prefix: '/api/sessions' });
  await app.register(mediaRoutes, { prefix: '/api/media' });

  return app;
}

