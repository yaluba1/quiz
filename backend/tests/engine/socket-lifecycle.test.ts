import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { createServer as createHttpServer, Server as HttpServer } from 'http';
import { io as ioc, Socket as ClientSocket } from 'socket.io-client';
import { initSocketServer, closeSocketServer, getSocketServer } from '../../src/engine/socket.js';
import { RoomStateManager } from '../../src/engine/state/room-state.manager.js';
import { setupMockRedis } from '../helpers/mock-redis.js';
import * as dbModule from '../../src/db/index.js';

describe('Socket.io Real-Time Game Engine Lifecycle', () => {
  let httpServer: HttpServer;
  let serverPort: number;
  let hostSocket: ClientSocket;
  let pupilSocket1: ClientSocket;
  let pupilSocket2: ClientSocket;

  beforeAll(async () => {
    setupMockRedis();
    httpServer = createHttpServer();
    initSocketServer(httpServer);
    expect(getSocketServer()).toBeDefined();

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address() as any;
        serverPort = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (hostSocket?.connected) hostSocket.disconnect();
    if (pupilSocket1?.connected) pupilSocket1.disconnect();
    if (pupilSocket2?.connected) pupilSocket2.disconnect();

    await closeSocketServer();
    expect(getSocketServer()).toBeNull();
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
  });

  function connectClient(): Promise<ClientSocket> {
    return new Promise((resolve) => {
      const socket = ioc(`http://127.0.0.1:${serverPort}`, {
        path: '/socket.io',
        transports: ['websocket'],
      });
      socket.on('connect', () => resolve(socket));
    });
  }

  it('completes full game lifecycle: creation, joins, answers, results, leaderboard, end, close', async () => {
    hostSocket = await connectClient();
    pupilSocket1 = await connectClient();
    pupilSocket2 = await connectClient();

    const qId = '00000000-0000-0000-0000-000000000010';
    const optId = '00000000-0000-0000-0000-000000000020';

    const mockQuiz = { id: 'quiz-uuid-1', professorId: 'prof-1', title: 'Science Quiz', themeId: null };
    const mockQuestions = [{ id: qId, questionText: 'Q1', timeLimitSeconds: 20, pointsMultiplier: '1.00', orderIndex: 0 }];
    const mockSession = { id: 'sess-uuid-1' };
    const mockOptions = [{ id: optId, questionId: qId, isCorrect: true, orderIndex: 0, colorShapeIndex: 0 }];

    let limitCount = 0;
    const mockDb: any = {
      select: vi.fn().mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => {
          return {
            where: vi.fn().mockImplementation(() => {
              const res: any = Promise.resolve(mockOptions);
              res.limit = vi.fn().mockImplementation(() => {
                limitCount++;
                if (limitCount === 1) return Promise.resolve([mockQuiz]);
                return Promise.resolve(mockOptions);
              });
              res.orderBy = vi.fn().mockImplementation(() => {
                const orderRes: any = Promise.resolve(mockOptions);
                orderRes.limit = vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockQuestions),
                });
                return orderRes;
              });
              return res;
            }),
          };
        }),
      })),
      insert: vi.fn().mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockSession]),
        }),
      }),
      update: vi.fn().mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      }),
    };
    vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb as any);

    // 1. Host creates room
    const createdPromise = new Promise<any>((resolve, reject) => {
      hostSocket.once('room:created', (data) => resolve(data));
      hostSocket.once('room:error', (err) => reject(new Error(JSON.stringify(err))));
    });

    hostSocket.emit('room:create', { quizId: 'quiz-uuid-1', durationMinutes: 60 });
    const createdData = await createdPromise;

    expect(createdData.pin).toBeDefined();
    expect(createdData.pin).toHaveLength(6);
    const pin = createdData.pin;

    // 2. Pupil 1 joins room
    const pupil1JoinPromise = new Promise<any>((resolve) => {
      pupilSocket1.once('room:joined', (data) => resolve(data));
    });

    pupilSocket1.emit('room:join', { pin, nickname: 'Marie Curie' });
    const pupil1Data = await pupil1JoinPromise;

    expect(pupil1Data.success).toBe(true);
    expect(pupil1Data.nickname).toBe('Marie Curie');

    // 3. Pupil 2 tries duplicate nickname -> rejected!
    const duplicateErrorPromise = new Promise<any>((resolve) => {
      pupilSocket2.once('room:error', (data) => resolve(data));
    });

    pupilSocket2.emit('room:join', { pin, nickname: 'Marie Curie' });
    const err = await duplicateErrorPromise;
    expect(err.code).toBe('NICKNAME_TAKEN');

    // 4. Pupil 2 joins with unique nickname -> accepted!
    const pupil2JoinPromise = new Promise<any>((resolve) => {
      pupilSocket2.once('room:joined', (data) => resolve(data));
    });

    pupilSocket2.emit('room:join', { pin, nickname: 'Albert Einstein' });
    const pupil2Data = await pupil2JoinPromise;
    expect(pupil2Data.success).toBe(true);

    // 4b. Host kicks pupil 2
    const kickedPromise = new Promise<any>((resolve) => {
      pupilSocket2.once('room:player_kicked', (data) => resolve(data));
    });
    hostSocket.emit('room:kick_player', { pin, playerId: pupil2Data.playerId });
    const kickedData = await kickedPromise;
    expect(kickedData.reason).toContain('removed');

    // 5. Host activates question
    await RoomStateManager.updateRoomMeta(pin, {
      status: 'QUESTION_ACTIVE',
      currentQuestionIndex: 0,
      questionStartTimeMs: Date.now() - 500,
      questionTimeLimitMs: 20000,
      questionBasePoints: 1000,
    });

    // 6. Pupil 1 submits answer
    const answerResultPromise = new Promise<any>((resolve) => {
      pupilSocket1.once('question:result_pupil', (data) => resolve(data));
    });

    pupilSocket1.emit('question:submit_answer', {
      pin,
      questionId: qId,
      optionId: optId,
    });

    const resultPupil = await answerResultPromise;
    expect(resultPupil.isCorrect).toBe(true);
    expect(resultPupil.pointsEarned).toBeGreaterThan(0);

    // 7. Host shows results
    const resultHostPromise = new Promise<any>((resolve) => {
      hostSocket.once('question:result_host', (data) => resolve(data));
    });

    hostSocket.emit('question:show_result', { pin });
    const resultHost = await resultHostPromise;
    expect(resultHost.answeredCount).toBe(1);

    // 8. Host shows leaderboard
    const leaderboardPromise = new Promise<any>((resolve) => {
      hostSocket.once('game:leaderboard', (data) => resolve(data));
    });

    hostSocket.emit('game:show_leaderboard', { pin });
    const leaderboardData = await leaderboardPromise;
    expect(leaderboardData.topPlayers.length).toBeGreaterThan(0);

    // 8b. Host advances to next question (which reaches podium)
    const podiumPromise = new Promise<any>((resolve) => {
      hostSocket.once('game:podium', (data) => resolve(data));
    });
    hostSocket.emit('game:next_question', { pin });
    const podiumData = await podiumPromise;
    expect(podiumData.podium).toBeDefined();

    // 9. Host ends game
    const gameEndedPromise = new Promise<any>((resolve) => {
      hostSocket.once('game:ended', (data) => resolve(data));
    });

    hostSocket.emit('game:end', { pin });
    const endedData = await gameEndedPromise;
    expect(endedData.status).toBe('FINISHED');

    // 10. Host closes room
    const roomClosedPromise = new Promise<any>((resolve) => {
      pupilSocket1.once('room:closed', (data) => resolve(data));
    });

    hostSocket.emit('room:close', { pin });
    const closedData = await roomClosedPromise;
    expect(closedData.reason).toContain('closed');
  }, 15000);
});
