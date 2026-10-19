import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../../src/api/server.js';
import { setAuthService } from '../../../src/auth/service.factory.js';
import { setupMockRedis } from '../../helpers/mock-redis.js';
import * as dbModule from '../../../src/db/index.js';

describe('Questions Routes Integration', () => {
  let app: FastifyInstance;
  const professor = { id: 'prof-uuid-1', email: 'prof@test.com', displayName: 'Prof', locale: 'en' };

  beforeAll(async () => {
    setupMockRedis();
    app = await createServer();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    setAuthService({
      register: vi.fn(),
      login: vi.fn(),
      refreshToken: vi.fn(),
      verifySession: vi.fn().mockResolvedValue(professor),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
    });
  });

  it('POST /api/quizzes/:quizId/questions creates question with options', async () => {
    const quiz = { id: '11111111-1111-1111-1111-111111111111', professorId: professor.id };
    const createdQuestion = {
      id: '22222222-2222-2222-2222-222222222222',
      quizId: quiz.id,
      orderIndex: 0,
      questionText: 'What is 2 + 2?',
      questionType: 'MULTIPLE_CHOICE',
      timeLimitSeconds: 20,
      pointsMultiplier: '1.00',
      mediaUrl: null,
      showAnswersOnDevice: false,
    };
    const createdOptions = [
      { id: '33333333-3333-3333-3333-333333333331', questionId: createdQuestion.id, orderIndex: 0, optionText: '3', isCorrect: false, colorShapeIndex: 0 },
      { id: '33333333-3333-3333-3333-333333333332', questionId: createdQuestion.id, orderIndex: 1, optionText: '4', isCorrect: true, colorShapeIndex: 1 },
    ];

    let insertCallCount = 0;
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([quiz]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => {
            insertCallCount++;
            if (insertCallCount === 1) return Promise.resolve([createdQuestion]);
            return Promise.resolve(createdOptions);
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: `/api/quizzes/${quiz.id}/questions`,
      headers: { authorization: 'Bearer token' },
      payload: {
        orderIndex: 0,
        questionText: 'What is 2 + 2?',
        questionType: 'MULTIPLE_CHOICE',
        timeLimitSeconds: 20,
        options: [
          { optionText: '3', isCorrect: false, colorShapeIndex: 0, orderIndex: 0 },
          { optionText: '4', isCorrect: true, colorShapeIndex: 1, orderIndex: 1 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.questionText).toBe('What is 2 + 2?');
    expect(body.options).toHaveLength(2);
  });

  it('POST /api/quizzes/:quizId/questions creates question with answerOptions field', async () => {
    const quiz = { id: '11111111-1111-1111-1111-111111111111', professorId: professor.id };
    const createdQuestion = {
      id: '22222222-2222-2222-2222-222222222222',
      quizId: quiz.id,
      orderIndex: 0,
      questionText: 'Grecia',
      questionType: 'MULTIPLE_CHOICE',
      timeLimitSeconds: 20,
      pointsMultiplier: '1.00',
      mediaUrl: null,
      showAnswersOnDevice: false,
    };
    const createdOptions = [
      { id: '33333333-3333-3333-3333-333333333331', questionId: createdQuestion.id, orderIndex: 0, optionText: 'Roma', isCorrect: false, colorShapeIndex: 0 },
      { id: '33333333-3333-3333-3333-333333333332', questionId: createdQuestion.id, orderIndex: 1, optionText: 'Atenas', isCorrect: true, colorShapeIndex: 1 },
      { id: '33333333-3333-3333-3333-333333333333', questionId: createdQuestion.id, orderIndex: 2, optionText: 'Tesalónica', isCorrect: false, colorShapeIndex: 2 },
      { id: '33333333-3333-3333-3333-333333333334', questionId: createdQuestion.id, orderIndex: 3, optionText: 'Trieste', isCorrect: false, colorShapeIndex: 3 },
    ];

    let insertCallCount = 0;
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([quiz]),
          }),
        }),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockImplementation(() => {
            insertCallCount++;
            if (insertCallCount === 1) return Promise.resolve([createdQuestion]);
            return Promise.resolve(createdOptions);
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: `/api/quizzes/${quiz.id}/questions`,
      headers: { authorization: 'Bearer token' },
      payload: {
        orderIndex: 0,
        questionText: 'Grecia',
        questionType: 'MULTIPLE_CHOICE',
        timeLimitSeconds: 20,
        pointsMultiplier: '1.00',
        showAnswersOnDevice: false,
        answerOptions: [
          { orderIndex: 0, optionText: 'Roma', isCorrect: false, colorShapeIndex: 0 },
          { orderIndex: 1, optionText: 'Atenas', isCorrect: true, colorShapeIndex: 1 },
          { orderIndex: 2, optionText: 'Tesalónica', isCorrect: false, colorShapeIndex: 2 },
          { orderIndex: 3, optionText: 'Trieste', isCorrect: false, colorShapeIndex: 3 },
        ],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.questionText).toBe('Grecia');
    expect(body.options).toHaveLength(4);
  });

  it('DELETE /api/questions/:id deletes question', async () => {
    const questionId = '22222222-2222-2222-2222-222222222222';
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: questionId, professorId: professor.id }]),
            }),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/questions/${questionId}`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(204);
  });

  it('PUT /api/questions/:id updates question and options', async () => {
    const questionId = '22222222-2222-2222-2222-222222222222';
    const existing = {
      question: { id: questionId, questionText: 'Old text', timeLimitSeconds: 20 },
      professorId: professor.id,
    };
    const updated = {
      id: questionId,
      quizId: '11111111-1111-1111-1111-111111111111',
      orderIndex: 0,
      questionText: 'New text',
      questionType: 'MULTIPLE_CHOICE',
      timeLimitSeconds: 30,
      pointsMultiplier: '1.00',
      mediaUrl: null,
      showAnswersOnDevice: false,
    };
    const updatedOptions = [
      { id: '33333333-3333-3333-3333-333333333331', questionId, orderIndex: 0, optionText: 'Opt A', isCorrect: true, colorShapeIndex: 0 },
      { id: '33333333-3333-3333-3333-333333333332', questionId, orderIndex: 1, optionText: 'Opt B', isCorrect: false, colorShapeIndex: 1 },
    ];

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([existing]),
            }),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue(updatedOptions),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'PUT',
      url: `/api/questions/${questionId}`,
      headers: { authorization: 'Bearer token' },
      payload: {
        questionText: 'New text',
        timeLimitSeconds: 30,
        options: [
          { optionText: 'Opt A', isCorrect: true, orderIndex: 0, colorShapeIndex: 0 },
          { optionText: 'Opt B', isCorrect: false, orderIndex: 1, colorShapeIndex: 1 },
        ],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.questionText).toBe('New text');
    expect(body.options).toHaveLength(2);
  });

  it('PUT /api/questions/:id returns 404 if not found or unauthorized', async () => {
    const questionId = '22222222-2222-2222-2222-222222222222';
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'PUT',
      url: `/api/questions/${questionId}`,
      headers: { authorization: 'Bearer token' },
      payload: { questionText: 'New text' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('DELETE /api/questions/:id returns 404 if not found', async () => {
    const questionId = '22222222-2222-2222-2222-222222222222';
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/questions/${questionId}`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('PUT /api/quizzes/:quizId/questions/reorder updates order indices', async () => {
    const quizId = '11111111-1111-1111-1111-111111111111';
    const q1 = '22222222-2222-2222-2222-222222222221';
    const q2 = '22222222-2222-2222-2222-222222222222';

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: quizId, professorId: professor.id }]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'PUT',
      url: `/api/quizzes/${quizId}/questions/reorder`,
      headers: { authorization: 'Bearer token' },
      payload: { questionIds: [q2, q1] },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
  });

  it('PUT /api/quizzes/:quizId/questions/reorder returns 404 if quiz not found', async () => {
    const quizId = '11111111-1111-1111-1111-111111111111';
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'PUT',
      url: `/api/quizzes/${quizId}/questions/reorder`,
      headers: { authorization: 'Bearer token' },
      payload: { questionIds: ['22222222-2222-2222-2222-222222222221'] },
    });

    expect(res.statusCode).toBe(404);
  });

  it('POST /api/quizzes/:quizId/questions returns 404 if quiz does not exist', async () => {
    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: '/api/quizzes/00000000-0000-0000-0000-000000000000/questions',
      headers: { authorization: 'Bearer token' },
      payload: {
        questionText: 'Test Question',
        options: [
          { optionText: 'Opt 1', isCorrect: true, orderIndex: 0, colorShapeIndex: 0 },
          { optionText: 'Opt 2', isCorrect: false, orderIndex: 1, colorShapeIndex: 1 },
        ],
      },
    });

    expect(res.statusCode).toBe(404);
  });
});
