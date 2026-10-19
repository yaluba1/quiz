import { FastifyRequest, FastifyReply } from 'fastify';
import { getAuthService } from './service.factory.js';
import { SessionUser } from './types.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: SessionUser;
  }
}

/**
 * Fastify preHandler hook to authenticate professor requests via Bearer token.
 */
export async function authenticateProfessor(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header with Bearer token',
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const authService = getAuthService();
    const user = await authService.verifySession(token);
    request.user = user;
  } catch (err: any) {
    reply.status(401).send({
      statusCode: 401,
      error: 'Unauthorized',
      message: err.message || 'Invalid or expired session token',
    });
  }
}

