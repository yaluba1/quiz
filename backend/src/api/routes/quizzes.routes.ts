import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { eq, and, sql, desc, ilike } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { authenticateProfessor } from '../../auth/middleware.js';
import { allocateUniquePin } from '../../engine/state/pin-generator.js';
import { getRedisClient } from '../../redis/client.js';
import { REDIS_KEYS, ROOM_GRACE_PERIOD_SECONDS } from '../../redis/keys.js';
import {
  QuizSchema,
  CreateQuizBodySchema,
  UpdateQuizBodySchema,
  QuizListQuerySchema,
  ActivateQuizBodySchema,
  ActivateQuizBody,
  ActivateQuizResponseSchema,
} from '../schemas/quizzes.schemas.js';
import {
  UuidParamSchema,
  ErrorResponseSchema,
} from '../schemas/common.schemas.js';

export async function quizzesRoutes(app: FastifyInstance): Promise<void> {
  // All quiz routes require professor authentication
  app.addHook('preHandler', authenticateProfessor);

  // GET /api/quizzes - List quizzes
  app.get(
    '/',
    {
      schema: {
        tags: ['Quizzes'],
        summary: 'List professor quizzes with search, tags, folder, and pagination',
        security: [{ BearerAuth: [] }],
        querystring: QuizListQuerySchema,
        response: {
          200: Type.Object({
            quizzes: Type.Array(QuizSchema),
            total: Type.Integer(),
            page: Type.Integer(),
            totalPages: Type.Integer(),
          }),
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const professorId = request.user!.id;
      const { page = 1, limit = 20, search, tag, level, subject, folder } = request.query as any;
      const offset = (page - 1) * limit;

      const conditions = [eq(schema.quizzes.professorId, professorId)];
      if (search && search.trim().length > 0) {
        conditions.push(ilike(schema.quizzes.title, `%${search.trim()}%`));
      }
      if (tag && tag.trim().length > 0) {
        conditions.push(sql`${schema.quizzes.tags} @> ARRAY[${tag.trim()}]::text[]`);
      }
      if (level && level.trim().length > 0) {
        conditions.push(eq(schema.quizzes.level, level.trim()));
      }
      if (subject && subject.trim().length > 0) {
        conditions.push(eq(schema.quizzes.subject, subject.trim()));
      }
      if (folder && folder.trim().length > 0) {
        conditions.push(eq(schema.quizzes.folder, folder.trim()));
      }

      const whereClause = and(...conditions);

      const [totalCountResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.quizzes)
        .where(whereClause);

      const total = Number(totalCountResult?.count || 0);

      const playCountSubquery = sql<number>`(
        SELECT count(*)::int
        FROM ${schema.gameSessions}
        WHERE ${schema.gameSessions.quizId} = ${schema.quizzes.id}
      )`.as('play_count');

      const quizList = await db
        .select({
          id: schema.quizzes.id,
          professorId: schema.quizzes.professorId,
          themeId: schema.quizzes.themeId,
          title: schema.quizzes.title,
          description: schema.quizzes.description,
          coverImageUrl: schema.quizzes.coverImageUrl,
          isPublic: schema.quizzes.isPublic,
          session_duration_minutes: schema.quizzes.session_duration_minutes,
          defaultQuestionTimeLimitSeconds: schema.quizzes.defaultQuestionTimeLimitSeconds,
          defaultExecutionMode: schema.quizzes.defaultExecutionMode,
          level: schema.quizzes.level,
          subject: schema.quizzes.subject,
          folder: schema.quizzes.folder,
          tags: schema.quizzes.tags,
          createdAt: schema.quizzes.createdAt,
          updatedAt: schema.quizzes.updatedAt,
          playCount: playCountSubquery,
        })
        .from(schema.quizzes)
        .where(whereClause)
        .orderBy(desc(schema.quizzes.createdAt))
        .limit(limit)
        .offset(offset);

      const formatted = quizList.map((q) => ({
        ...q,
        sessionDurationMinutes: q.session_duration_minutes,
        defaultQuestionTimeLimitSeconds: q.defaultQuestionTimeLimitSeconds ?? 20,
        defaultExecutionMode: q.defaultExecutionMode ?? 'MANUAL',
        level: q.level || null,
        subject: q.subject || null,
        folder: q.folder || null,
        tags: q.tags || [],
        playCount: Number(q.playCount || 0),
        createdAt: q.createdAt.toISOString(),
        updatedAt: q.updatedAt.toISOString(),
      }));

      return reply.status(200).send({
        quizzes: formatted,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
      });
    }
  );

  // POST /api/quizzes - Create quiz
  app.post(
    '/',
    {
      schema: {
        tags: ['Quizzes'],
        summary: 'Create a new quiz',
        security: [{ BearerAuth: [] }],
        body: CreateQuizBodySchema,
        response: {
          201: QuizSchema,
          400: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const professorId = request.user!.id;
      const body = request.body as any;

      const [newQuiz] = await db
        .insert(schema.quizzes)
        .values({
          professorId,
          title: body.title.trim(),
          description: body.description || null,
          themeId: body.themeId || null,
          coverImageUrl: body.coverImageUrl || null,
          isPublic: body.isPublic || false,
          session_duration_minutes: body.sessionDurationMinutes || 60,
          defaultQuestionTimeLimitSeconds: body.defaultQuestionTimeLimitSeconds ?? 20,
          defaultExecutionMode: body.defaultExecutionMode || 'MANUAL',
          level: body.level || null,
          subject: body.subject || null,
          folder: body.folder || null,
          tags: body.tags || [],
        })
        .returning();

      return reply.status(201).send({
        ...newQuiz,
        sessionDurationMinutes: newQuiz.session_duration_minutes,
        defaultQuestionTimeLimitSeconds: newQuiz.defaultQuestionTimeLimitSeconds ?? 20,
        defaultExecutionMode: newQuiz.defaultExecutionMode ?? 'MANUAL',
        level: newQuiz.level || null,
        subject: newQuiz.subject || null,
        folder: newQuiz.folder || null,
        tags: newQuiz.tags || [],
        playCount: 0,
        createdAt: newQuiz.createdAt.toISOString(),
        updatedAt: newQuiz.updatedAt.toISOString(),
      });
    }
  );

  // GET /api/quizzes/:id - Get quiz details with questions
  app.get(
    '/:id',
    {
      schema: {
        tags: ['Quizzes'],
        summary: 'Get quiz details including questions and answer options',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        response: {
          200: Type.Object({
            quiz: QuizSchema,
            questions: Type.Array(Type.Any()),
          }),
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;

      const playCountSubquery = sql<number>`(
        SELECT count(*)::int
        FROM ${schema.gameSessions}
        WHERE ${schema.gameSessions.quizId} = ${schema.quizzes.id}
      )`.as('play_count');

      const [quiz] = await db
        .select({
          id: schema.quizzes.id,
          professorId: schema.quizzes.professorId,
          themeId: schema.quizzes.themeId,
          title: schema.quizzes.title,
          description: schema.quizzes.description,
          coverImageUrl: schema.quizzes.coverImageUrl,
          isPublic: schema.quizzes.isPublic,
          session_duration_minutes: schema.quizzes.session_duration_minutes,
          defaultQuestionTimeLimitSeconds: schema.quizzes.defaultQuestionTimeLimitSeconds,
          defaultExecutionMode: schema.quizzes.defaultExecutionMode,
          level: schema.quizzes.level,
          subject: schema.quizzes.subject,
          folder: schema.quizzes.folder,
          tags: schema.quizzes.tags,
          createdAt: schema.quizzes.createdAt,
          updatedAt: schema.quizzes.updatedAt,
          playCount: playCountSubquery,
        })
        .from(schema.quizzes)
        .where(and(eq(schema.quizzes.id, id), eq(schema.quizzes.professorId, professorId)))
        .limit(1);

      if (!quiz) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Quiz not found or access denied',
        });
      }

      // Fetch questions and options
      const questionRows = await db
        .select()
        .from(schema.questions)
        .where(eq(schema.questions.quizId, quiz.id))
        .orderBy(schema.questions.orderIndex);

      const questionIds = questionRows.map((q) => q.id);
      let optionsRows: any[] = [];
      if (questionIds.length > 0) {
        optionsRows = await db
          .select()
          .from(schema.answerOptions)
          .where(sql`${schema.answerOptions.questionId} IN ${questionIds}`)
          .orderBy(schema.answerOptions.orderIndex);
      }

      const questionsWithOpts = questionRows.map((q) => {
        const opts = optionsRows.filter((opt) => opt.questionId === q.id);
        return {
          ...q,
          options: opts,
          answerOptions: opts,
        };
      });

      return reply.status(200).send({
        quiz: {
          ...quiz,
          sessionDurationMinutes: quiz.session_duration_minutes,
          defaultQuestionTimeLimitSeconds: quiz.defaultQuestionTimeLimitSeconds ?? 20,
          defaultExecutionMode: quiz.defaultExecutionMode ?? 'MANUAL',
          level: quiz.level || null,
          subject: quiz.subject || null,
          folder: quiz.folder || null,
          tags: quiz.tags || [],
          playCount: Number(quiz.playCount || 0),
          createdAt: quiz.createdAt.toISOString(),
          updatedAt: quiz.updatedAt.toISOString(),
        },
        questions: questionsWithOpts,
      });
    }
  );

  // PUT /api/quizzes/:id - Update quiz
  app.put(
    '/:id',
    {
      schema: {
        tags: ['Quizzes'],
        summary: 'Update quiz metadata',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        body: UpdateQuizBodySchema,
        response: {
          200: QuizSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;
      const body = request.body as any;

      const updateValues: any = { updatedAt: new Date() };
      if (body.title !== undefined) updateValues.title = body.title.trim();
      if (body.description !== undefined) updateValues.description = body.description;
      if (body.themeId !== undefined) updateValues.themeId = body.themeId;
      if (body.coverImageUrl !== undefined) updateValues.coverImageUrl = body.coverImageUrl;
      if (body.isPublic !== undefined) updateValues.isPublic = body.isPublic;
      if (body.sessionDurationMinutes !== undefined) {
        updateValues.session_duration_minutes = body.sessionDurationMinutes;
      }
      if (body.defaultQuestionTimeLimitSeconds !== undefined) {
        updateValues.defaultQuestionTimeLimitSeconds = body.defaultQuestionTimeLimitSeconds;
      }
      if (body.defaultExecutionMode !== undefined) {
        updateValues.defaultExecutionMode = body.defaultExecutionMode;
      }
      if (body.level !== undefined) updateValues.level = body.level;
      if (body.subject !== undefined) updateValues.subject = body.subject;
      if (body.folder !== undefined) updateValues.folder = body.folder;
      if (body.tags !== undefined) updateValues.tags = body.tags;

      const [updatedQuiz] = await db
        .update(schema.quizzes)
        .set(updateValues)
        .where(and(eq(schema.quizzes.id, id), eq(schema.quizzes.professorId, professorId)))
        .returning();

      if (!updatedQuiz) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Quiz not found or access denied',
        });
      }

      const [playCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.gameSessions)
        .where(eq(schema.gameSessions.quizId, updatedQuiz.id));
      const playCount = Number(playCountResult?.count || 0);

      return reply.status(200).send({
        ...updatedQuiz,
        sessionDurationMinutes: updatedQuiz.session_duration_minutes,
        defaultQuestionTimeLimitSeconds: updatedQuiz.defaultQuestionTimeLimitSeconds ?? 20,
        defaultExecutionMode: updatedQuiz.defaultExecutionMode ?? 'MANUAL',
        level: updatedQuiz.level || null,
        subject: updatedQuiz.subject || null,
        folder: updatedQuiz.folder || null,
        tags: updatedQuiz.tags || [],
        playCount,
        createdAt: updatedQuiz.createdAt.toISOString(),
        updatedAt: updatedQuiz.updatedAt.toISOString(),
      });
    }
  );

  // DELETE /api/quizzes/:id - Delete quiz
  app.delete(
    '/:id',
    {
      schema: {
        tags: ['Quizzes'],
        summary: 'Delete quiz and related questions',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        response: {
          204: Type.Null(),
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;

      const [deleted] = await db
        .delete(schema.quizzes)
        .where(and(eq(schema.quizzes.id, id), eq(schema.quizzes.professorId, professorId)))
        .returning({ id: schema.quizzes.id });

      if (!deleted) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Quiz not found or access denied',
        });
      }

      return reply.status(204).send();
    }
  );

  // POST /api/quizzes/:id/duplicate - Duplicate quiz
  app.post(
    '/:id/duplicate',
    {
      schema: {
        tags: ['Quizzes'],
        summary: 'Clone an existing quiz and its questions',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        response: {
          201: QuizSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;

      const [original] = await db
        .select()
        .from(schema.quizzes)
        .where(and(eq(schema.quizzes.id, id), eq(schema.quizzes.professorId, professorId)))
        .limit(1);

      if (!original) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Quiz not found or access denied',
        });
      }

      // Insert cloned quiz
      const [cloned] = await db
        .insert(schema.quizzes)
        .values({
          professorId,
          title: `${original.title} (Copy)`,
          description: original.description,
          themeId: original.themeId,
          coverImageUrl: original.coverImageUrl,
          isPublic: false,
          session_duration_minutes: original.session_duration_minutes,
          defaultQuestionTimeLimitSeconds: original.defaultQuestionTimeLimitSeconds ?? 20,
          defaultExecutionMode: original.defaultExecutionMode ?? 'MANUAL',
          level: original.level || null,
          subject: original.subject || null,
          folder: original.folder || null,
          tags: original.tags || [],
        })
        .returning();

      // Clone questions and answer options
      const originalQuestions = await db
        .select()
        .from(schema.questions)
        .where(eq(schema.questions.quizId, original.id))
        .orderBy(schema.questions.orderIndex);

      for (const q of originalQuestions) {
        const [clonedQuestion] = await db
          .insert(schema.questions)
          .values({
            quizId: cloned.id,
            orderIndex: q.orderIndex,
            questionText: q.questionText,
            questionType: q.questionType,
            timeLimitSeconds: q.timeLimitSeconds,
            pointsMultiplier: q.pointsMultiplier,
            mediaUrl: q.mediaUrl,
            mediaType: q.mediaType,
            showAnswersOnDevice: q.showAnswersOnDevice,
          })
          .returning();

        const opts = await db
          .select()
          .from(schema.answerOptions)
          .where(eq(schema.answerOptions.questionId, q.id))
          .orderBy(schema.answerOptions.orderIndex);

        if (opts.length > 0) {
          await db.insert(schema.answerOptions).values(
            opts.map((opt) => ({
              questionId: clonedQuestion.id,
              orderIndex: opt.orderIndex,
              optionText: opt.optionText,
              isCorrect: opt.isCorrect,
              colorShapeIndex: opt.colorShapeIndex,
            }))
          );
        }
      }

      return reply.status(201).send({
        ...cloned,
        sessionDurationMinutes: cloned.session_duration_minutes,
        defaultQuestionTimeLimitSeconds: cloned.defaultQuestionTimeLimitSeconds ?? 20,
        defaultExecutionMode: cloned.defaultExecutionMode ?? 'MANUAL',
        level: cloned.level || null,
        subject: cloned.subject || null,
        folder: cloned.folder || null,
        tags: cloned.tags || [],
        playCount: 0,
        createdAt: cloned.createdAt.toISOString(),
        updatedAt: cloned.updatedAt.toISOString(),
      });
    }
  );

  // POST /api/quizzes/:id/activate - Activate quiz for live classroom play
  app.post(
    '/:id/activate',
    {
      schema: {
        tags: ['Quizzes'],
        summary: 'Activate a quiz session and generate 6-digit PIN with expiration',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        body: ActivateQuizBodySchema,
        response: {
          201: ActivateQuizResponseSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;
      const body = (request.body as ActivateQuizBody) || {};

      const [quiz] = await db
        .select()
        .from(schema.quizzes)
        .where(and(eq(schema.quizzes.id, id), eq(schema.quizzes.professorId, professorId)))
        .limit(1);

      if (!quiz) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Quiz not found or access denied',
        });
      }

      // Check that quiz has questions
      const questionCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.questions)
        .where(eq(schema.questions.quizId, quiz.id));

      const totalQuestions = Number(questionCountResult[0]?.count || 0);
      if (totalQuestions === 0) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: 'Cannot activate a quiz with 0 questions. Please add questions first.',
        });
      }

      // Determine expiration
      const durationMinutes = body.durationMinutes || quiz.session_duration_minutes || 60;
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationMinutes * 60 * 1000);
      const executionMode = body.executionMode || quiz.defaultExecutionMode || 'MANUAL';

      // Allocate unique 6-digit PIN
      const pin = await allocateUniquePin();

      // Insert game_sessions record in PostgreSQL
      const [session] = await db
        .insert(schema.gameSessions)
        .values({
          quizId: quiz.id,
          professorId,
          title: body.title?.trim() || null,
          classGroup: body.classGroup?.trim() || null,
          pin,
          status: 'LOBBY',
          executionMode,
          totalParticipants: 0,
          started_at: now,
          expires_at: expiresAt,
        })
        .returning();

      // Seed Redis room metadata
      const redis = getRedisClient();
      const metaKey = REDIS_KEYS.roomMeta(pin);
      const ttlSeconds = durationMinutes * 60 + ROOM_GRACE_PERIOD_SECONDS;

      await redis.hset(metaKey, {
        sessionId: session.id,
        professorId,
        quizId: quiz.id,
        pin,
        status: 'LOBBY',
        executionMode,
        currentQuestionIndex: '-1',
        totalQuestions: totalQuestions.toString(),
        expiresAt: expiresAt.toISOString(),
      });
      await redis.expire(metaKey, ttlSeconds);
      await redis.sadd(REDIS_KEYS.activeRooms(), pin);

      return reply.status(201).send({
        sessionId: session.id,
        pin,
        status: 'LOBBY',
        executionMode,
        expiresAt: expiresAt.toISOString(),
        quizId: quiz.id,
        quizTitle: quiz.title,
        totalQuestions,
        title: session.title || null,
        classGroup: session.classGroup || null,
      });
    }
  );
}

