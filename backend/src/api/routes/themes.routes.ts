import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { eq, or, and } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { authenticateProfessor } from '../../auth/middleware.js';
import {
  ThemeSchema,
  CreateThemeBodySchema,
  UpdateThemeBodySchema,
  UploadLogoResponseSchema,
} from '../schemas/themes.schemas.js';
import {
  UuidParamSchema,
  ErrorResponseSchema,
} from '../schemas/common.schemas.js';

export async function themesRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticateProfessor);

  // GET /api/themes - List system presets and professor themes
  app.get(
    '/',
    {
      schema: {
        tags: ['Themes'],
        summary: 'List available preset themes and professor custom themes',
        security: [{ BearerAuth: [] }],
        response: {
          200: Type.Object({
            systemThemes: Type.Array(ThemeSchema),
            customThemes: Type.Array(ThemeSchema),
          }),
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const professorId = request.user!.id;

      const allThemes = await db
        .select()
        .from(schema.themes)
        .where(or(eq(schema.themes.isSystemPreset, true), eq(schema.themes.professorId, professorId)));

      const systemThemes = allThemes
        .filter((t) => t.isSystemPreset)
        .map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }));

      const customThemes = allThemes
        .filter((t) => !t.isSystemPreset)
        .map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }));

      return reply.status(200).send({ systemThemes, customThemes });
    }
  );

  // POST /api/themes - Create custom theme
  app.post(
    '/',
    {
      schema: {
        tags: ['Themes'],
        summary: 'Create custom theme with colors, logo, and fonts',
        security: [{ BearerAuth: [] }],
        body: CreateThemeBodySchema,
        response: {
          201: ThemeSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const professorId = request.user!.id;
      const body = request.body as any;

      const [newTheme] = await db
        .insert(schema.themes)
        .values({
          professorId,
          name: body.name.trim(),
          isSystemPreset: false,
          primaryColor: body.primaryColor || '#93C572',
          secondaryColor: body.secondaryColor || '#FF7518',
          backgroundColor: body.backgroundColor || '#F7F9F6',
          fontFamily: body.fontFamily || 'Inter',
          logoUrl: body.logoUrl || null,
          customCssVars: body.customCssVars || {},
        })
        .returning();

      return reply.status(201).send({
        ...newTheme,
        createdAt: newTheme.createdAt.toISOString(),
      });
    }
  );

  // PUT /api/themes/:id - Update custom theme
  app.put(
    '/:id',
    {
      schema: {
        tags: ['Themes'],
        summary: 'Update a professor custom theme',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        body: UpdateThemeBodySchema,
        response: {
          200: ThemeSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;
      const body = request.body as any;

      const [existing] = await db
        .select()
        .from(schema.themes)
        .where(eq(schema.themes.id, id))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Theme not found',
        });
      }

      if (existing.isSystemPreset) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: 'System preset themes cannot be modified',
        });
      }

      if (existing.professorId !== professorId) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Theme not found or access denied',
        });
      }

      const updateValues: any = {};
      if (body.name !== undefined) updateValues.name = body.name.trim();
      if (body.primaryColor !== undefined) updateValues.primaryColor = body.primaryColor;
      if (body.secondaryColor !== undefined) updateValues.secondaryColor = body.secondaryColor;
      if (body.backgroundColor !== undefined) updateValues.backgroundColor = body.backgroundColor;
      if (body.fontFamily !== undefined) updateValues.fontFamily = body.fontFamily;
      if (body.logoUrl !== undefined) updateValues.logoUrl = body.logoUrl;
      if (body.customCssVars !== undefined) updateValues.customCssVars = body.customCssVars;

      const [updated] = await db
        .update(schema.themes)
        .set(updateValues)
        .where(eq(schema.themes.id, id))
        .returning();

      return reply.status(200).send({
        ...updated,
        createdAt: updated.createdAt.toISOString(),
      });
    }
  );

  // DELETE /api/themes/:id - Delete custom theme
  app.delete(
    '/:id',
    {
      schema: {
        tags: ['Themes'],
        summary: 'Delete custom theme',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        response: {
          204: Type.Null(),
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;

      const [existing] = await db
        .select()
        .from(schema.themes)
        .where(eq(schema.themes.id, id))
        .limit(1);

      if (!existing) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Theme not found',
        });
      }

      if (existing.isSystemPreset) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: 'System preset themes cannot be deleted',
        });
      }

      if (existing.professorId !== professorId) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Theme not found or access denied',
        });
      }

      await db.delete(schema.themes).where(eq(schema.themes.id, id));
      return reply.status(204).send();
    }
  );

  // POST /api/themes/upload-logo - Upload institution logo
  app.post(
    '/upload-logo',
    {
      schema: {
        tags: ['Themes'],
        summary: 'Upload institution logo image',
        security: [{ BearerAuth: [] }],
        response: {
          200: UploadLogoResponseSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const data = await request.file();
      if (!data) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: 'No file uploaded',
        });
      }

      // Check mime type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
      if (!allowedTypes.includes(data.mimetype)) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: 'Invalid file type. Allowed: PNG, JPEG, SVG, WebP',
        });
      }

      const buffer = await data.toBuffer();
      // Generate base64 data URI (portable and works in Swarm multi-replica without distributed filesystem)
      const base64Uri = `data:${data.mimetype};base64,${buffer.toString('base64')}`;

      return reply.status(200).send({ logoUrl: base64Uri });
    }
  );
}

