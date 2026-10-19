import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { eq, and, sql } from 'drizzle-orm';
import { getDb, schema } from '../../db/index.js';
import { authenticateProfessor } from '../../auth/middleware.js';
import {
  CreateQuestionBodySchema,
  UpdateQuestionBodySchema,
  ReorderQuestionsBodySchema,
  QuestionSchema,
} from '../schemas/questions.schemas.js';
import {
  UuidParamSchema,
  QuizIdParamSchema,
  ErrorResponseSchema,
} from '../schemas/common.schemas.js';

export async function questionsRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('preHandler', authenticateProfessor);

  // POST /api/quizzes/:quizId/questions - Add question
  app.post(
    '/quizzes/:quizId/questions',
    {
      preValidation: async (request) => {
        const body = request.body as any;
        if (body && typeof body === 'object') {
          if (!body.options && body.answerOptions) {
            body.options = body.answerOptions;
          }
        }
      },
      schema: {
        tags: ['Questions'],
        summary: 'Add a new question with answer options to a quiz',
        security: [{ BearerAuth: [] }],
        params: QuizIdParamSchema,
        body: CreateQuestionBodySchema,
        response: {
          201: QuestionSchema,
          400: ErrorResponseSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { quizId } = request.params as any;
      const professorId = request.user!.id;
      const body = request.body as any;

      const rawOptions = body.options || body.answerOptions;
      if (!rawOptions || !Array.isArray(rawOptions) || rawOptions.length < 2) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'BadRequest',
          message: 'Question must have at least 2 answer options',
        });
      }

      // Verify quiz ownership
      const [quiz] = await db
        .select()
        .from(schema.quizzes)
        .where(and(eq(schema.quizzes.id, quizId), eq(schema.quizzes.professorId, professorId)))
        .limit(1);

      if (!quiz) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Quiz not found or access denied',
        });
      }

      // Determine orderIndex
      let orderIndex = body.orderIndex;
      if (orderIndex === undefined) {
        const [maxOrder] = await db
          .select({ max: sql<number>`COALESCE(MAX(${schema.questions.orderIndex}), -1)` })
          .from(schema.questions)
          .where(eq(schema.questions.quizId, quizId));
        orderIndex = Number(maxOrder?.max ?? -1) + 1;
      }

      const [newQuestion] = await db
        .insert(schema.questions)
        .values({
          quizId,
          orderIndex,
          questionText: body.questionText.trim(),
          questionType: body.questionType || 'MULTIPLE_CHOICE',
          timeLimitSeconds: body.timeLimitSeconds || 20,
          pointsMultiplier: body.pointsMultiplier || '1.00',
          mediaUrl: body.mediaUrl || null,
          mediaType: (body.mediaType as any) || null,
          showAnswersOnDevice: body.showAnswersOnDevice || false,
        })
        .returning();

      // Insert answer options
      const optionsToInsert = body.options.map((opt: any, index: number) => ({
        questionId: newQuestion.id,
        orderIndex: opt.orderIndex !== undefined ? opt.orderIndex : index,
        optionText: opt.optionText.trim(),
        isCorrect: Boolean(opt.isCorrect),
        colorShapeIndex: opt.colorShapeIndex !== undefined ? opt.colorShapeIndex : index % 4,
      }));

      const insertedOptions = await db
        .insert(schema.answerOptions)
        .values(optionsToInsert)
        .returning();

      return reply.status(201).send({
        ...newQuestion,
        options: insertedOptions,
      });
    }
  );

  // PUT /api/questions/:id - Update question & options
  app.put(
    '/questions/:id',
    {
      preValidation: async (request) => {
        const body = request.body as any;
        if (body && typeof body === 'object') {
          if (!body.options && body.answerOptions) {
            body.options = body.answerOptions;
          }
        }
      },
      schema: {
        tags: ['Questions'],
        summary: 'Update question text, settings, and options',
        security: [{ BearerAuth: [] }],
        params: UuidParamSchema,
        body: UpdateQuestionBodySchema,
        response: {
          200: QuestionSchema,
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { id } = request.params as any;
      const professorId = request.user!.id;
      const body = request.body as any;

      // Find question and verify ownership through quiz
      const [existingQuestion] = await db
        .select({
          question: schema.questions,
          professorId: schema.quizzes.professorId,
        })
        .from(schema.questions)
        .innerJoin(schema.quizzes, eq(schema.questions.quizId, schema.quizzes.id))
        .where(eq(schema.questions.id, id))
        .limit(1);

      if (!existingQuestion || existingQuestion.professorId !== professorId) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Question not found or access denied',
        });
      }

      const updateValues: any = {};
      if (body.questionText !== undefined) updateValues.questionText = body.questionText.trim();
      if (body.questionType !== undefined) updateValues.questionType = body.questionType;
      if (body.timeLimitSeconds !== undefined) updateValues.timeLimitSeconds = body.timeLimitSeconds;
      if (body.pointsMultiplier !== undefined) updateValues.pointsMultiplier = body.pointsMultiplier;
      if (body.mediaUrl !== undefined) updateValues.mediaUrl = body.mediaUrl;
      if (body.mediaType !== undefined) updateValues.mediaType = body.mediaType;
      if (body.showAnswersOnDevice !== undefined) updateValues.showAnswersOnDevice = body.showAnswersOnDevice;

      let updatedQuestion = existingQuestion.question;
      if (Object.keys(updateValues).length > 0) {
        const [updated] = await db
          .update(schema.questions)
          .set(updateValues)
          .where(eq(schema.questions.id, id))
          .returning();
        updatedQuestion = updated;
      }

      // Update options if provided
      let currentOptions: any[] = [];
      if (body.options && Array.isArray(body.options)) {
        await db.delete(schema.answerOptions).where(eq(schema.answerOptions.questionId, id));

        const optionsToInsert = body.options.map((opt: any, index: number) => ({
          questionId: id,
          orderIndex: opt.orderIndex !== undefined ? opt.orderIndex : index,
          optionText: opt.optionText.trim(),
          isCorrect: Boolean(opt.isCorrect),
          colorShapeIndex: opt.colorShapeIndex !== undefined ? opt.colorShapeIndex : index % 4,
        }));

        currentOptions = await db
          .insert(schema.answerOptions)
          .values(optionsToInsert)
          .returning();
      } else {
        currentOptions = await db
          .select()
          .from(schema.answerOptions)
          .where(eq(schema.answerOptions.questionId, id))
          .orderBy(schema.answerOptions.orderIndex);
      }

      return reply.status(200).send({
        ...updatedQuestion,
        options: currentOptions,
      });
    }
  );

  // DELETE /api/questions/:id - Delete question
  app.delete(
    '/questions/:id',
    {
      schema: {
        tags: ['Questions'],
        summary: 'Delete question and options',
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

      const [existingQuestion] = await db
        .select({
          id: schema.questions.id,
          professorId: schema.quizzes.professorId,
        })
        .from(schema.questions)
        .innerJoin(schema.quizzes, eq(schema.questions.quizId, schema.quizzes.id))
        .where(eq(schema.questions.id, id))
        .limit(1);

      if (!existingQuestion || existingQuestion.professorId !== professorId) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Question not found or access denied',
        });
      }

      await db.delete(schema.questions).where(eq(schema.questions.id, id));
      return reply.status(204).send();
    }
  );

  // PUT /api/quizzes/:quizId/questions/reorder - Reorder questions
  app.put(
    '/quizzes/:quizId/questions/reorder',
    {
      schema: {
        tags: ['Questions'],
        summary: 'Reorder questions by providing an ordered list of IDs',
        security: [{ BearerAuth: [] }],
        params: QuizIdParamSchema,
        body: ReorderQuestionsBodySchema,
        response: {
          200: Type.Object({ success: Type.Boolean() }),
          404: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const db = getDb();
      const { quizId } = request.params as any;
      const professorId = request.user!.id;
      const { questionIds } = request.body as any;

      const [quiz] = await db
        .select()
        .from(schema.quizzes)
        .where(and(eq(schema.quizzes.id, quizId), eq(schema.quizzes.professorId, professorId)))
        .limit(1);

      if (!quiz) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'NotFound',
          message: 'Quiz not found or access denied',
        });
      }

      for (let i = 0; i < questionIds.length; i++) {
        await db
          .update(schema.questions)
          .set({ orderIndex: i })
          .where(and(eq(schema.questions.id, questionIds[i]), eq(schema.questions.quizId, quizId)));
      }

      return reply.status(200).send({ success: true });
    }
  );
}

