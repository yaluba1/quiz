import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { getAuthService } from '../../auth/service.factory.js';
import { authenticateProfessor } from '../../auth/middleware.js';
import {
  RegisterBodySchema,
  RegisterSuccessResponseSchema,
  VerifyEmailBodySchema,
  VerifyEmailSuccessResponseSchema,
  LoginBodySchema,
  ForgotPasswordBodySchema,
  ResetPasswordBodySchema,
  AuthSuccessResponseSchema,
  RefreshSuccessResponseSchema,
  UserSchema,
} from '../schemas/auth.schemas.js';
import { ErrorResponseSchema } from '../schemas/common.schemas.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Register
  app.post(
    '/register',
    {
      preValidation: async (request) => {
        const body = request.body as any;
        if (body && typeof body === 'object') {
          if (!body.displayName && body.name) {
            body.displayName = body.name;
          }
        }
      },
      schema: {
        tags: ['Auth'],
        summary: 'Register a new professor account',
        body: RegisterBodySchema,
        response: {
          201: RegisterSuccessResponseSchema,
          400: ErrorResponseSchema,
          409: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const authService = getAuthService();
        const result = await authService.register(request.body as any);

        return reply.status(201).send({
          success: true,
          message: result.message || 'Registration successful. Please check your email to verify your account.',
          email: result.email,
          requiresVerification: true,
        });
      } catch (err: any) {
        if (err.message.includes('already registered')) {
          return reply.status(409).send({
            statusCode: 409,
            error: 'Conflict',
            message: err.message,
          });
        }
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: err.message,
        });
      }
    }
  );

  // Verify Email (POST with body token)
  app.post(
    '/verify-email',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Verify professor email address with token',
        body: VerifyEmailBodySchema,
        response: {
          200: VerifyEmailSuccessResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { token } = request.body as any;
        const authService = getAuthService();
        const result = await authService.verifyEmail(token);
        return reply.status(200).send(result);
      } catch (err: any) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: err.message,
        });
      }
    }
  );

  // Verify Email (GET with query token)
  app.get(
    '/verify-email',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Verify professor email address via GET link',
        querystring: Type.Object({ token: Type.String() }),
        response: {
          200: VerifyEmailSuccessResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { token } = request.query as any;
        const authService = getAuthService();
        const result = await authService.verifyEmail(token);
        return reply.status(200).send(result);
      } catch (err: any) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: err.message,
        });
      }
    }
  );

  // Login
  app.post(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Professor login with email and password',
        body: LoginBodySchema,
        response: {
          200: AuthSuccessResponseSchema,
          401: ErrorResponseSchema,
          403: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const authService = getAuthService();
        const result = await authService.login(request.body as any);

        if (result.tokens.refreshToken) {
          reply.setCookie('refreshToken', result.tokens.refreshToken, {
            path: '/api/auth',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 3600,
          });
        }

        return reply.status(200).send({
          user: result.user,
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
        });
      } catch (err: any) {
        if (err.message.includes('not verified')) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: err.message,
          });
        }
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: err.message || 'Invalid email or password',
        });
      }
    }
  );

  // Refresh token
  app.post(
    '/refresh',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Refresh expired access token using httpOnly cookie or body token',
        response: {
          200: RefreshSuccessResponseSchema,
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const refreshToken =
        (request.cookies && request.cookies.refreshToken) ||
        (request.body as any)?.refreshToken;

      if (!refreshToken) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'No refresh token provided',
        });
      }

      try {
        const authService = getAuthService();
        const tokens = await authService.refreshToken(refreshToken);

        if (tokens.refreshToken) {
          reply.setCookie('refreshToken', tokens.refreshToken, {
            path: '/api/auth',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 3600,
          });
        }

        return reply.status(200).send({
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn,
        });
      } catch (err: any) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: err.message || 'Invalid or expired refresh token',
        });
      }
    }
  );

  // Logout
  app.post(
    '/logout',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Professor logout (clears session cookie)',
        response: {
          200: Type.Object({ success: Type.Boolean() }),
        },
      },
    },
    async (_request, reply) => {
      reply.clearCookie('refreshToken', { path: '/api/auth' });
      return reply.status(200).send({ success: true });
    }
  );

  // Get current professor profile
  app.get(
    '/me',
    {
      preHandler: [authenticateProfessor],
      schema: {
        tags: ['Auth'],
        summary: 'Get current authenticated professor profile',
        security: [{ BearerAuth: [] }],
        response: {
          200: Type.Object({ user: UserSchema }),
          401: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      return reply.status(200).send({ user: request.user });
    }
  );

  // Forgot password
  app.post(
    '/forgot-password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Request password reset token',
        body: ForgotPasswordBodySchema,
        response: {
          200: Type.Object({
            success: Type.Boolean(),
            message: Type.String(),
            resetToken: Type.Optional(Type.String()),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email } = request.body as any;
      const authService = getAuthService();
      const result = await authService.requestPasswordReset(email);

      return reply.status(200).send({
        success: true,
        message: 'If an account exists with this email, password reset instructions have been generated',
        resetToken: result.resetToken,
      });
    }
  );

  // Reset password
  app.post(
    '/reset-password',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Reset password using reset token',
        body: ResetPasswordBodySchema,
        response: {
          200: Type.Object({ success: Type.Boolean() }),
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const authService = getAuthService();
        await authService.resetPassword(request.body as any);
        return reply.status(200).send({ success: true });
      } catch (err: any) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: err.message,
        });
      }
    }
  );
}
