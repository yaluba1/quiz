import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { authenticateProfessor } from '../../auth/middleware.js';
import { getRedisClient } from '../../redis/client.js';
import { REDIS_KEYS } from '../../redis/keys.js';
import {
  GameSessionSummarySchema,
  GameSessionDetailSchema,
  CloseSessionResponseSchema,
  SessionMetricsResponseSchema,
} from '../schemas/sessions.schemas.js';
import {
  UuidParamSchema,
  ErrorResponseSchema,
} from '../schemas/common.schemas.js';

export async function sessionsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticateProfessor);

  // GET /api/sessions - List game sessions
  app.get(
    '/',
    {
      schema: {
        tags: ['Sessions'],
        summary: 'List historical and active sessions for the professor',
        security: [{ BearerAuth: [] }],
        response: {
          200: Type.Object({
            sessions: Type.Array(GameSessionSummarySchema),
          }),
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const professorId = request.user!.id;

      const sessionsList = await db
        .select({
          id: schema.gameSessions.id,
          quizId: schema.gameSessions.quizId,
          quizTitle: schema.quizzes.title,
          title: schema.gameSessions.title,
          classGroup: schema.gameSessions.classGroup,
          pin: schema.gameSessions.pin,
          status: schema.gameSessions.status,
          executionMode: schema.gameSessions.executionMode,
          totalParticipants: schema.gameSessions.totalParticipants,
          startedAt: schema.gameSessions.started_at,
          endedAt: schema.gameSessions.ended_at,
          expiresAt: schema.gameSessions.expires_at,
        })
        .from(schema.gameSessions)
        .innerJoin(schema.quizzes, eq(schema.gameSessions.quizId, schema.quizzes.id))
        .where(eq(schema.gameSessions.professorId, professorId))
        .orderBy(desc(schema.gameSessions.started_at));

      const formatted = sessionsList.map((s) => ({
        ...s,
        title: s.title || null,
        classGroup: s.classGroup || null,
        executionMode: s.executionMode || 'MANUAL',
        startedAt: s.startedAt.toISOString(),
        endedAt: s.endedAt ? s.endedAt.toISOString() : null,
        expiresAt: s.expiresAt ? s.expiresAt.toISOString() : null,
      }));

      return reply.status(200).send({ sessions: formatted });
    }
  );

  // GET /api/sessions/:id - Get session analytics detail
  app.get(
    '/:id',
    {
      schema: {
        tags: ['Sessions'],
        summary: 'Get session report with participant scores and accuracy breakdown',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        response: {
          200: GameSessionDetailSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;

      const [session] = await db
        .select({
          id: schema.gameSessions.id,
          quizId: schema.gameSessions.quizId,
          quizTitle: schema.quizzes.title,
          title: schema.gameSessions.title,
          classGroup: schema.gameSessions.classGroup,
          pin: schema.gameSessions.pin,
          status: schema.gameSessions.status,
          executionMode: schema.gameSessions.executionMode,
          totalParticipants: schema.gameSessions.totalParticipants,
          startedAt: schema.gameSessions.started_at,
          endedAt: schema.gameSessions.ended_at,
          expiresAt: schema.gameSessions.expires_at,
        })
        .from(schema.gameSessions)
        .innerJoin(schema.quizzes, eq(schema.gameSessions.quizId, schema.quizzes.id))
        .where(and(eq(schema.gameSessions.id, id), eq(schema.gameSessions.professorId, professorId)))
        .limit(1);

      if (!session) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Game session not found or access denied',
        });
      }

      const results = await db
        .select()
        .from(schema.gameSessionResults)
        .where(eq(schema.gameSessionResults.sessionId, session.id))
        .orderBy(schema.gameSessionResults.finalRank);

      return reply.status(200).send({
        session: {
          ...session,
          title: session.title || null,
          classGroup: session.classGroup || null,
          executionMode: session.executionMode || 'MANUAL',
          startedAt: session.startedAt.toISOString(),
          endedAt: session.endedAt ? session.endedAt.toISOString() : null,
          expiresAt: session.expiresAt ? session.expiresAt.toISOString() : null,
        },
        results: results.map((r) => ({
          id: r.id,
          nickname: r.nickname,
          finalScore: r.finalScore,
          finalRank: r.finalRank,
          correctAnswersCount: r.correctAnswersCount,
          totalQuestionsCount: r.totalQuestionsCount,
          answerDetails: r.answerDetails,
        })),
      });
    }
  );

  // GET /api/sessions/:id/metrics - Aggregated session metrics & question-level breakdown
  app.get(
    '/:id/metrics',
    {
      schema: {
        tags: ['Sessions'],
        summary: 'Get aggregated session metrics and per-question distribution',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        response: {
          200: SessionMetricsResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;

      const [session] = await db
        .select({
          id: schema.gameSessions.id,
          quizId: schema.gameSessions.quizId,
          title: schema.gameSessions.title,
          classGroup: schema.gameSessions.classGroup,
          pin: schema.gameSessions.pin,
          status: schema.gameSessions.status,
          totalParticipants: schema.gameSessions.totalParticipants,
          startedAt: schema.gameSessions.started_at,
          endedAt: schema.gameSessions.ended_at,
        })
        .from(schema.gameSessions)
        .where(and(eq(schema.gameSessions.id, id), eq(schema.gameSessions.professorId, professorId)))
        .limit(1);

      if (!session) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Game session not found or access denied',
        });
      }

      // Fetch questions in order
      const questions = await db
        .select({
          id: schema.questions.id,
          questionText: schema.questions.questionText,
          orderIndex: schema.questions.orderIndex,
        })
        .from(schema.questions)
        .where(eq(schema.questions.quizId, session.quizId))
        .orderBy(schema.questions.orderIndex);

      const questionIds = questions.map((q) => q.id);
      let options: any[] = [];
      if (questionIds.length > 0) {
        options = await db
          .select({
            id: schema.answerOptions.id,
            questionId: schema.answerOptions.questionId,
          })
          .from(schema.answerOptions)
          .where(sql`${schema.answerOptions.questionId} IN ${questionIds}`);
      }

      // Fetch all participant results
      const results = await db
        .select()
        .from(schema.gameSessionResults)
        .where(eq(schema.gameSessionResults.sessionId, session.id));

      const allAnswerDetails: any[] = [];
      for (const r of results) {
        if (Array.isArray(r.answerDetails)) {
          allAnswerDetails.push(...r.answerDetails);
        }
      }

      const totalParticipants = results.length > 0 ? results.length : session.totalParticipants;
      const averageScore = results.length > 0
        ? Math.round((results.reduce((sum, r) => sum + r.finalScore, 0) / results.length) * 100) / 100
        : 0;

      const validResponses = allAnswerDetails.filter(
        (a) => typeof a.responseTimeMs === 'number' && a.responseTimeMs > 0
      );
      const averageResponseTimeMs = validResponses.length > 0
        ? Math.round(validResponses.reduce((sum, a) => sum + a.responseTimeMs, 0) / validResponses.length)
        : 0;

      const totalAnswersCount = allAnswerDetails.length;
      const totalCorrectCount = allAnswerDetails.filter((a) => a.isCorrect).length;
      const overallAccuracyPercentage = totalAnswersCount > 0
        ? Math.round((totalCorrectCount / totalAnswersCount) * 100 * 100) / 100
        : 0;

      const questionMetrics = questions.map((q) => {
        const qAnswers = allAnswerDetails.filter((a) => a.questionId === q.id);
        const qTotalAnswers = qAnswers.length;
        const qCorrectCount = qAnswers.filter((a) => a.isCorrect).length;
        const qEmptyCount = qAnswers.filter((a) => !a.selectedOptionId || (a as any).isEmpty).length;
        const qWrongCount = qTotalAnswers - qCorrectCount;
        const qCorrectPercentage = qTotalAnswers > 0
          ? Math.round((qCorrectCount / qTotalAnswers) * 100 * 100) / 100
          : 0;

        const qTimes = qAnswers
          .map((a) => a.responseTimeMs)
          .filter((t): t is number => typeof t === 'number' && t > 0);
        const qAvgResponseTime = qTimes.length > 0
          ? Math.round(qTimes.reduce((sum, t) => sum + t, 0) / qTimes.length)
          : 0;

        const optionDistribution: Record<string, number> = {};
        const qOpts = options.filter((opt) => opt.questionId === q.id);
        for (const opt of qOpts) {
          optionDistribution[opt.id] = 0;
        }
        for (const ans of qAnswers) {
          if (ans.selectedOptionId) {
            optionDistribution[ans.selectedOptionId] = (optionDistribution[ans.selectedOptionId] || 0) + 1;
          }
        }

        return {
          questionId: q.id,
          questionText: q.questionText,
          totalAnswers: qTotalAnswers,
          correctCount: qCorrectCount,
          wrongCount: qWrongCount,
          emptyCount: qEmptyCount,
          correctPercentage: qCorrectPercentage,
          averageResponseTimeMs: qAvgResponseTime,
          optionDistribution,
        };
      });

      return reply.status(200).send({
        session: {
          id: session.id,
          title: session.title || null,
          classGroup: session.classGroup || null,
          pin: session.pin,
          status: session.status,
          totalParticipants,
          startedAt: session.startedAt.toISOString(),
          endedAt: session.endedAt ? session.endedAt.toISOString() : null,
          averageScore,
          averageResponseTimeMs,
          overallAccuracyPercentage,
        },
        questions: questionMetrics,
      });
    }
  );

  // POST /api/sessions/:id/close - Professor manually closes active session
  app.post(
    '/:id/close',
    {
      schema: {
        tags: ['Sessions'],
        summary: 'Manually close an active session at any time',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        response: {
          200: CloseSessionResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;
      const now = new Date();

      const [session] = await db
        .select()
        .from(schema.gameSessions)
        .where(and(eq(schema.gameSessions.id, id), eq(schema.gameSessions.professorId, professorId)))
        .limit(1);

      if (!session) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Game session not found or access denied',
        });
      }

      // Update session status to FINISHED
      const [updated] = await db
        .update(schema.gameSessions)
        .set({
          status: 'FINISHED',
          ended_at: now,
        })
        .where(eq(schema.gameSessions.id, session.id))
        .returning();

      // Clean up Redis active room marker
      const redis = getRedisClient();
      await redis.srem(REDIS_KEYS.activeRooms(), session.pin);

      return reply.status(200).send({
        success: true,
        sessionId: updated.id,
        status: updated.status,
        endedAt: updated.ended_at!.toISOString(),
      });
    }
  );
}

