import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { Type } from '@sinclair/typebox';
import { authenticateProfessor } from '../../auth/middleware.js';
import { storageService, ALLOWED_MIME_TYPES } from '../../services/storage.service.js';

export const MediaUploadResponseSchema = Type.Object({
  url: Type.String(),
  mediaType: Type.Union([
    Type.Literal('IMAGE'),
    Type.Literal('AUDIO'),
    Type.Literal('VIDEO'),
  ]),
  filename: Type.String(),
  size: Type.Integer(),
});

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
  // Only authenticated professors can upload media
  app.addHook('preHandler', authenticateProfessor);

  app.post(
    '/upload',
    {
      schema: {
        tags: ['Media'],
        summary: 'Upload multimedia file (image, audio, or video) for questions',
        security: [{ BearerAuth: [] }],
        response: {
          201: MediaUploadResponseSchema,
          400: Type.Object({
            error: Type.String(),
            message: Type.String(),
          }),
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: 'No file uploaded. Please provide a file in multipart/form-data.',
        });
      }

      try {
        const buffer = await data.toBuffer();

        if (buffer.length === 0) {
          return reply.status(400).send({
            error: 'BadRequest',
            message: 'Uploaded file is empty.',
          });
        }

        const result = await storageService.uploadMedia(
          buffer,
          data.filename || 'media',
          data.mimetype
        );

        return reply.status(201).send(result);
      } catch (err: any) {
        return reply.status(400).send({
          error: 'BadRequest',
          message: err?.message || 'Failed to upload multimedia file.',
        });
      }
    }
  );
}

