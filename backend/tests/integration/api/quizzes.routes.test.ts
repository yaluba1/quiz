import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import { FastifyInstance } from 'fastify';
import { createServer } from '../../../src/api/server.js';
import { setAuthService } from '../../../src/auth/service.factory.js';
import { setupMockRedis } from '../../helpers/mock-redis.js';
import * as dbModule from '../../../src/db/index.js';

describe('Quizzes Routes Integration', () => {
  let app: FastifyInstance;
  const professor = { id: '00000000-0000-0000-0000-000000000001', email: 'prof@test.com', displayName: 'Prof', locale: 'en' };

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

  it('GET /api/quizzes lists professor quizzes', async () => {
    const dummyQuiz = {
      id: '00000000-0000-0000-0000-000000000010',
      professorId: professor.id,
      themeId: null,
      title: 'Math 101',
      description: 'Algebra quiz',
      coverImageUrl: null,
      isPublic: false,
      session_duration_minutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDb: any = {
      select: vi.fn().mockImplementation((fields) => {
        // Count query vs select query
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              if (fields && fields.count) {
                return Promise.resolve([{ count: 1 }]);
              }
              return {
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue([dummyQuiz]),
                  }),
                }),
              };
            }),
          }),
        };
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: '/api/quizzes?page=1&limit=10',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.quizzes).toHaveLength(1);
    expect(body.quizzes[0].title).toBe('Math 101');
    expect(body.quizzes[0].sessionDurationMinutes).toBe(60);
    expect(body.total).toBe(1);
  });

  it('POST /api/quizzes creates a quiz with custom sessionDurationMinutes', async () => {
    const newQuiz = {
      id: '00000000-0000-0000-0000-000000000020',
      professorId: professor.id,
      themeId: null,
      title: 'Physics 101',
      description: 'Quantum Mechanics',
      coverImageUrl: null,
      isPublic: true,
      session_duration_minutes: 45,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDb: any = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newQuiz]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: '/api/quizzes',
      headers: { authorization: 'Bearer token' },
      payload: {
        title: 'Physics 101',
        description: 'Quantum Mechanics',
        sessionDurationMinutes: 45,
        isPublic: true,
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.title).toBe('Physics 101');
    expect(body.sessionDurationMinutes).toBe(45);
  });

  it('POST /api/quizzes creates quiz with null themeId and extra metadata', async () => {
    const newQuiz = {
      id: '22222222-2222-2222-2222-222222222222',
      professorId: '11111111-1111-1111-1111-111111111111',
      themeId: null,
      title: 'Capitales europeas',
      description: 'Preguntas sobre capitales europeas',
      coverImageUrl: null,
      isPublic: false,
      session_duration_minutes: 60,
      level: 'NA',
      subject: 'Geografía',
      folder: 'Test',
      tags: ['geografia', 'test'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDb: any = {
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newQuiz]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: '/api/quizzes',
      headers: { authorization: 'Bearer token' },
      payload: {
        title: 'Capitales europeas',
        description: 'Preguntas sobre capitales europeas',
        subject: 'Geografía',
        level: 'NA',
        folder: 'Test',
        tags: ['geografia', 'test'],
        themeId: null,
        professorId: 'dfd48f81-c5cf-4e5b-9a73-34e35cf65ad6',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.title).toBe('Capitales europeas');
    expect(body.themeId).toBeNull();
  });

  it('GET /api/quizzes/:id returns 404 if not found', async () => {
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
      method: 'GET',
      url: '/api/quizzes/00000000-0000-0000-0000-000000000000',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('POST /api/quizzes/:id/activate generates 6-digit PIN and room session', async () => {
    const quiz = {
      id: '11111111-1111-1111-1111-111111111111',
      professorId: professor.id,
      title: 'Biology 101',
      session_duration_minutes: 60,
    };

    const session = {
      id: '22222222-2222-2222-2222-222222222222',
      quizId: quiz.id,
      professorId: professor.id,
      title: 'Period 3 Biology',
      classGroup: 'Grade 10B',
      pin: '654321',
      status: 'LOBBY',
      started_at: new Date(),
      expires_at: new Date(Date.now() + 3600000),
    };

    let insertedValues: any = null;
    const mockDb: any = {
      select: vi.fn().mockImplementation((fields) => {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              if (fields && fields.count) {
                return Promise.resolve([{ count: 3 }]); // 3 questions
              }
              return {
                limit: vi.fn().mockResolvedValue([quiz]),
              };
            }),
          }),
        };
      }),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((vals) => {
          insertedValues = vals;
          return {
            returning: vi.fn().mockResolvedValue([session]),
          };
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: `/api/quizzes/${quiz.id}/activate`,
      headers: { authorization: 'Bearer token' },
      payload: { durationMinutes: 60, title: 'Period 3 Biology', classGroup: 'Grade 10B' },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.sessionId).toBe('22222222-2222-2222-2222-222222222222');
    expect(body.pin).toHaveLength(6);
    expect(body.status).toBe('LOBBY');
    expect(body.totalQuestions).toBe(3);
    expect(body.title).toBe('Period 3 Biology');
    expect(body.classGroup).toBe('Grade 10B');
    expect(insertedValues.title).toBe('Period 3 Biology');
    expect(insertedValues.classGroup).toBe('Grade 10B');
    expect(body.expiresAt).toBeDefined();
  });

  it('POST /api/quizzes/:id/activate returns 400 if quiz has 0 questions', async () => {
    const quiz = {
      id: '11111111-1111-1111-1111-111111111111',
      professorId: professor.id,
      title: 'Empty Quiz',
      session_duration_minutes: 60,
    };

    const mockDb: any = {
      select: vi.fn().mockImplementation((fields) => {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              if (fields && fields.count) {
                return Promise.resolve([{ count: 0 }]); // 0 questions!
              }
              return {
                limit: vi.fn().mockResolvedValue([quiz]),
              };
            }),
          }),
        };
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: `/api/quizzes/${quiz.id}/activate`,
      headers: { authorization: 'Bearer token' },
      payload: {},
    });

    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.message).toContain('0 questions');
  });

  it('GET /api/quizzes/:id returns quiz with questions and options', async () => {
    const quizId = '11111111-1111-1111-1111-111111111111';
    const quiz = {
      id: quizId,
      professorId: professor.id,
      themeId: null,
      title: 'Full Quiz',
      description: null,
      coverImageUrl: null,
      isPublic: false,
      session_duration_minutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const question = {
      id: '22222222-2222-2222-2222-222222222222',
      quizId,
      questionText: 'Q1',
      questionType: 'MULTIPLE_CHOICE',
      timeLimitSeconds: 20,
      pointsMultiplier: '1.00',
      mediaUrl: null,
      showAnswersOnDevice: false,
      orderIndex: 0,
    };
    const option = {
      id: '33333333-3333-3333-3333-333333333333',
      questionId: question.id,
      optionText: 'Option 1',
      isCorrect: true,
      colorShapeIndex: 0,
      orderIndex: 0,
    };

    let selectCount = 0;
    const mockDb: any = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            selectCount++;
            if (selectCount === 1) {
              return { limit: vi.fn().mockResolvedValue([quiz]) };
            }
            if (selectCount === 2) {
              return { orderBy: vi.fn().mockResolvedValue([question]) };
            }
            return { orderBy: vi.fn().mockResolvedValue([option]) };
          }),
        }),
      })),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: `/api/quizzes/${quizId}`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.quiz.title).toBe('Full Quiz');
    expect(body.questions).toHaveLength(1);
    expect(body.questions[0].options).toHaveLength(1);
  });

  it('PUT /api/quizzes/:id updates quiz fields', async () => {
    const quizId = '11111111-1111-1111-1111-111111111111';
    const updated = {
      id: quizId,
      professorId: professor.id,
      themeId: null,
      title: 'New Title',
      description: null,
      coverImageUrl: null,
      isPublic: false,
      session_duration_minutes: 90,
      level: 'Advanced',
      subject: 'Physics',
      folder: 'Semester 1',
      tags: ['quantum', 'mechanics'],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDb: any = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updated]),
          }),
        }),
      }),
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'PUT',
      url: `/api/quizzes/${quizId}`,
      headers: { authorization: 'Bearer token' },
      payload: {
        title: 'New Title',
        sessionDurationMinutes: 90,
        level: 'Advanced',
        subject: 'Physics',
        folder: 'Semester 1',
        tags: ['quantum', 'mechanics'],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.title).toBe('New Title');
    expect(body.sessionDurationMinutes).toBe(90);
    expect(body.level).toBe('Advanced');
    expect(body.subject).toBe('Physics');
    expect(body.folder).toBe('Semester 1');
    expect(body.tags).toEqual(['quantum', 'mechanics']);
    expect(body.playCount).toBe(3);
  });

  it('DELETE /api/quizzes/:id deletes quiz', async () => {
    const quizId = '11111111-1111-1111-1111-111111111111';
    const existing = { id: quizId, professorId: professor.id };

    const mockDb: any = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([existing]),
          }),
        }),
      }),
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: quizId }]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/quizzes/${quizId}`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(204);
  });

  it('POST /api/quizzes/:id/clone clones quiz, questions, and options', async () => {
    const origId = '11111111-1111-1111-1111-111111111111';
    const clonedId = '22222222-2222-2222-2222-222222222222';
    const original = {
      id: origId,
      professorId: professor.id,
      title: 'Original Quiz',
      description: null,
      themeId: null,
      coverImageUrl: null,
      isPublic: false,
      session_duration_minutes: 60,
      level: 'High School',
      subject: 'History',
      folder: 'European History',
      tags: ['ww2', 'europe'],
    };
    const cloned = {
      ...original,
      id: clonedId,
      title: 'Original Quiz (Copy)',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const origQuestion = {
      id: '33333333-3333-3333-3333-333333333333',
      quizId: origId,
      orderIndex: 0,
      questionText: 'Q1',
      questionType: 'MULTIPLE_CHOICE',
      timeLimitSeconds: 20,
      pointsMultiplier: '1.00',
      mediaUrl: null,
      showAnswersOnDevice: false,
    };
    const clonedQuestion = { ...origQuestion, id: '44444444-4444-4444-4444-444444444444', quizId: clonedId };
    const origOption = {
      id: '55555555-5555-5555-5555-555555555555',
      questionId: origQuestion.id,
      orderIndex: 0,
      optionText: 'Opt 1',
      isCorrect: true,
      colorShapeIndex: 0,
    };

    let selectCount = 0;
    let insertCount = 0;
    let duplicateInsertVals: any = null;
    const mockDb: any = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            selectCount++;
            if (selectCount === 1) {
              return { limit: vi.fn().mockResolvedValue([original]) };
            }
            if (selectCount === 2) {
              return { orderBy: vi.fn().mockResolvedValue([origQuestion]) };
            }
            return { orderBy: vi.fn().mockResolvedValue([origOption]) };
          }),
        }),
      })),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockImplementation((vals) => {
          insertCount++;
          if (insertCount === 1) {
            duplicateInsertVals = vals;
            return { returning: vi.fn().mockResolvedValue([cloned]) };
          }
          return { returning: vi.fn().mockResolvedValue([clonedQuestion]) };
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'POST',
      url: `/api/quizzes/${origId}/duplicate`,
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.title).toBe('Original Quiz (Copy)');
    expect(body.level).toBe('High School');
    expect(body.subject).toBe('History');
    expect(body.folder).toBe('European History');
    expect(body.tags).toEqual(['ww2', 'europe']);
    expect(body.playCount).toBe(0);
    expect(duplicateInsertVals.level).toBe('High School');
    expect(duplicateInsertVals.subject).toBe('History');
    expect(duplicateInsertVals.folder).toBe('European History');
    expect(duplicateInsertVals.tags).toEqual(['ww2', 'europe']);
  });

  it('POST /api/quizzes/:id/duplicate returns 404 when original not found', async () => {
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
      url: '/api/quizzes/00000000-0000-0000-0000-000000000000/duplicate',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('POST /api/quizzes/:id/activate returns 404 when quiz not found', async () => {
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
      url: '/api/quizzes/00000000-0000-0000-0000-000000000000/activate',
      headers: { authorization: 'Bearer token' },
      payload: {},
    });

    expect(res.statusCode).toBe(404);
  });

  it('PUT /api/quizzes/:id returns 404 if not found', async () => {
    const mockDb: any = {
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'PUT',
      url: '/api/quizzes/00000000-0000-0000-0000-000000000000',
      headers: { authorization: 'Bearer token' },
      payload: { title: 'Ghost' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('DELETE /api/quizzes/:id returns 404 if not found', async () => {
    const mockDb: any = {
      delete: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'DELETE',
      url: '/api/quizzes/00000000-0000-0000-0000-000000000000',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(404);
  });

  it('GET /api/quizzes filters by tag, level, subject, and folder', async () => {
    const quizFiltered = {
      id: '00000000-0000-0000-0000-000000000099',
      professorId: professor.id,
      themeId: null,
      title: 'Chemistry Exam',
      description: 'Organic chemistry',
      coverImageUrl: null,
      isPublic: false,
      session_duration_minutes: 45,
      level: 'University',
      subject: 'Chemistry',
      folder: 'Semester 2',
      tags: ['organic', 'lab'],
      playCount: 12,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockDb: any = {
      select: vi.fn().mockImplementation((fields) => {
        return {
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              if (fields && fields.count) {
                return Promise.resolve([{ count: 1 }]);
              }
              return {
                orderBy: vi.fn().mockReturnValue({
                  limit: vi.fn().mockReturnValue({
                    offset: vi.fn().mockResolvedValue([quizFiltered]),
                  }),
                }),
              };
            }),
          }),
        };
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    const res = await app.inject({
      method: 'GET',
      url: '/api/quizzes?tag=organic&level=University&subject=Chemistry&folder=Semester%202&search=Chemistry',
      headers: { authorization: 'Bearer token' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.quizzes).toHaveLength(1);
    expect(body.quizzes[0].title).toBe('Chemistry Exam');
    expect(body.quizzes[0].level).toBe('University');
    expect(body.quizzes[0].subject).toBe('Chemistry');
    expect(body.quizzes[0].folder).toBe('Semester 2');
    expect(body.quizzes[0].tags).toEqual(['organic', 'lab']);
    expect(body.quizzes[0].playCount).toBe(12);
  });
});

