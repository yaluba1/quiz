import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Open Quiz Platform REST API',
        description:
          'High-performance REST API and management service for quizzes, themes, questions, authentication, and session analytics.',
        version: '1.0.0',
        contact: {
          name: 'Open Quiz Team',
        },
        license: {
          name: 'GPL-3.0-or-later',
        },
      },
      servers: [
        {
          url: '/api',
          description: 'Default API gateway path',
        },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your Bearer access token issued from /api/auth/login or /api/auth/register',
          },
          CookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'refreshToken',
            description: 'HttpOnly secure refresh token cookie',
          },
        },
      },
      tags: [
        { name: 'Health', description: 'System health probes and readiness checks' },
        { name: 'Auth', description: 'Professor authentication, session tokens, and password reset' },
        { name: 'Quizzes', description: 'Quiz authoring, duplication, listing, and live activation' },
        { name: 'Questions', description: 'Questions and answer options management' },
        { name: 'Themes', description: 'Custom visual themes, palettes, and logo uploads' },
        { name: 'Sessions', description: 'Past game sessions and post-quiz analytics' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/api/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      displayRequestDuration: true,
    },
    staticCSP: true,
  });
}

