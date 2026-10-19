import { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from 'fastify';

export function setupErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
    const statusCode = error.statusCode && error.statusCode >= 400 && error.statusCode < 600
      ? error.statusCode
      : 500;

    const errorName = error.name || 'InternalServerError';
    const message = error.message || 'An unexpected server error occurred';

    if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
      app.log.error(error);
    }

    reply.status(statusCode).send({
      statusCode,
      error: errorName,
      message,
      timestamp: new Date().toISOString(),
    });
  });

  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    reply.status(404).send({
      statusCode: 404,
      error: 'NotFound',
      message: `Route ${request.method} ${request.url} not found`,
      timestamp: new Date().toISOString(),
    });
  });
}

