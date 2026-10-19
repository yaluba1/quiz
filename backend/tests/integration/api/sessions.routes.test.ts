import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../../src/api/server.js';
import { setAuthService } from '../../../src/auth/service.factory.js';
import { setupMockRedis } from '../../helpers/mock-redis.js';
import * as dbModule from '../../../src/db/index.js';

describe('Sessions Routes Integration', () => {
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

  it('GET /api/sessions lists professor sessions', async () => {
    const sessionSummary = {
      id: 'sess-uuid-1',
      quizId: 'quiz-uuid-1',
      quizTitle: 'Math 101',
      title: 'Class 4A Live',
      classGroup: 'Period 1',
      pin: '123456',
      status: 'FINISHED',
      totalParticipants: 24,
      startedAt: new Date(),
      endedAt: new Date(),
      expiresAt: new Date(),
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([sessionSummary]),
            }),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: '/api/sessions',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.sessions).toHaveLength(1);
    expect(body.sessions[0].totalParticipants).toBe(24);
    expect(body.sessions[0].title).toBe('Class 4A Live');
    expect(body.sessions[0].classGroup).toBe('Period 1');
  });

  it('POST /api/sessions/:id/close manually closes active session', async () => {
    const session = {
      id: '44444444-4444-4444-4444-444444444444',
      professorId: professor.id,
      pin: '123456',
      status: 'LOBBY',
    };
    const closedSession = {
      id: '44444444-4444-4444-4444-444444444444',
      status: 'FINISHED',
      ended_at: new Date(),
    };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([session]),
          }),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([closedSession]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions/44444444-4444-4444-4444-444444444444/close',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.success).toBe(true);
    expect(body.status).toBe('FINISHED');
    expect(body.endedAt).toBeDefined();
  });

  it('GET /api/sessions/:id returns detailed session with participant results', async () => {
    const sessionId = '44444444-4444-4444-4444-444444444444';
    const session = {
      id: sessionId,
      quizId: '11111111-1111-1111-1111-111111111111',
      quizTitle: 'Math 101',
      title: 'Class 4A Live',
      classGroup: 'Period 1',
      pin: '123456',
      status: 'FINISHED',
      totalParticipants: 1,
      startedAt: new Date(),
      endedAt: new Date(),
      expiresAt: new Date(),
    };
    const results = [
      {
        id: '55555555-5555-5555-5555-555555555555',
        nickname: 'Alice',
        finalScore: 1850,
        finalRank: 1,
        correctAnswersCount: 2,
        totalQuestionsCount: 2,
        answerDetails: [],
      },
    ];

    let selectCall = 0;
    const mockDb: any = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([session]),
            }),
          }),
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(results),
          }),
        })),
      })),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: `/api/sessions/${sessionId}`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.session.id).toBe(sessionId);
    expect(body.session.title).toBe('Class 4A Live');
    expect(body.session.classGroup).toBe('Period 1');
    expect(body.results).toHaveLength(1);
    expect(body.results[0].nickname).toBe('Alice');
  });

  it('GET /api/sessions/:id returns 404 when session not found', async () => {
    const mockDb: any = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          innerJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        })),
      })),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: '/api/sessions/00000000-0000-0000-0000-000000000000',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('POST /api/sessions/:id/close returns 404 when session not found', async () => {
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
      url: '/api/sessions/00000000-0000-0000-0000-000000000000/close',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('GET /api/sessions/:id/metrics returns aggregated metrics and question breakdown', async () => {
    const sessionId = '44444444-4444-4444-4444-444444444444';
    const quizId = '11111111-1111-1111-1111-111111111111';
    const q1Id = '22222222-2222-2222-2222-222222222222';
    const opt1Id = '33333333-3333-3333-3333-333333333333';
    const opt2Id = '33333333-3333-3333-3333-333333333334';

    const session = {
      id: sessionId,
      quizId,
      title: 'Period 1 Algebra',
      classGroup: 'Class 8A',
      pin: '123456',
      status: 'FINISHED',
      totalParticipants: 2,
      startedAt: new Date('2026-10-08T10:00:00Z'),
      endedAt: new Date('2026-10-08T10:45:00Z'),
    };

    const q2Id = '22222222-2222-2222-2222-222222222223';
    const questions = [
      { id: q1Id, questionText: 'What is 2+2?', orderIndex: 0 },
      { id: q2Id, questionText: 'What is 3+3?', orderIndex: 1 },
    ];
    const options = [
      { id: opt1Id, questionId: q1Id },
      { id: opt2Id, questionId: q1Id },
    ];
    const results = [
      {
        id: 'r1',
        sessionId,
        finalScore: 1000,
        answerDetails: [
          { questionId: q1Id, selectedOptionId: opt1Id, responseTimeMs: 1200, isCorrect: true, pointsEarned: 1000 },
        ],
      },
      {
        id: 'r2',
        sessionId,
        finalScore: 0,
        answerDetails: [
          { questionId: q1Id, selectedOptionId: opt2Id, responseTimeMs: 2400, isCorrect: false, pointsEarned: 0 },
        ],
      },
    ];

    let selectCall = 0;
    const mockDb: any = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectCall++;
            if (selectCall === 1) {
              return { limit: vi.fn().mockResolvedValue([session]) };
            }
            if (selectCall === 2) {
              return { orderBy: vi.fn().mockResolvedValue(questions) };
            }
            if (selectCall === 3) {
              return Promise.resolve(options);
            }
            return Promise.resolve(results);
          }),
        })),
      })),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: `/api/sessions/${sessionId}/metrics`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.session.id).toBe(sessionId);
    expect(body.session.title).toBe('Period 1 Algebra');
    expect(body.session.classGroup).toBe('Class 8A');
    expect(body.session.totalParticipants).toBe(2);
    expect(body.session.averageScore).toBe(500);
    expect(body.session.averageResponseTimeMs).toBe(1800);
    expect(body.session.overallAccuracyPercentage).toBe(50);

    expect(body.questions).toHaveLength(2);
    const q1Metrics = body.questions[0];
    expect(q1Metrics.questionId).toBe(q1Id);
    expect(q1Metrics.questionText).toBe('What is 2+2?');
    expect(q1Metrics.totalAnswers).toBe(2);
    expect(q1Metrics.correctCount).toBe(1);
    expect(q1Metrics.wrongCount).toBe(1);
    expect(q1Metrics.correctPercentage).toBe(50);
    expect(q1Metrics.averageResponseTimeMs).toBe(1800);
    expect(q1Metrics.optionDistribution[opt1Id]).toBe(1);
    expect(q1Metrics.optionDistribution[opt2Id]).toBe(1);

    const q2Metrics = body.questions[1];
    expect(q2Metrics.questionId).toBe(q2Id);
    expect(q2Metrics.totalAnswers).toBe(0);
    expect(q2Metrics.correctPercentage).toBe(0);
    expect(q2Metrics.averageResponseTimeMs).toBe(0);
  });

  it('GET /api/sessions/:id/metrics handles empty participant results gracefully', async () => {
    const sessionId = '44444444-4444-4444-4444-444444444444';
    const quizId = '11111111-1111-1111-1111-111111111111';

    const session = {
      id: sessionId,
      quizId,
      title: null,
      classGroup: null,
      pin: '123456',
      status: 'LOBBY',
      totalParticipants: 0,
      startedAt: new Date('2026-10-08T10:00:00Z'),
      endedAt: null,
    };

    let selectCall = 0;
    const mockDb: any = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => {
            selectCall++;
            if (selectCall === 1) return { limit: vi.fn().mockResolvedValue([session]) };
            if (selectCall === 2) return { orderBy: vi.fn().mockResolvedValue([]) };
            return Promise.resolve([]);
          }),
        })),
      })),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: `/api/sessions/${sessionId}/metrics`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.session.totalParticipants).toBe(0);
    expect(body.session.averageScore).toBe(0);
    expect(body.session.averageResponseTimeMs).toBe(0);
    expect(body.session.overallAccuracyPercentage).toBe(0);
    expect(body.questions).toHaveLength(0);
  });

  it('GET /api/sessions/:id/metrics returns 404 when session not found', async () => {
    const mockDb: any = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        })),
      })),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: '/api/sessions/00000000-0000-0000-0000-000000000000/metrics',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(404);
  });
});

