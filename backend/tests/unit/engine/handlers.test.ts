import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerLobbyHandlers } from '../../../src/engine/handlers/lobby.handler.js';
import { registerGameFlowHandlers } from '../../../src/engine/handlers/game-flow.handler.js';
import { registerHostControlHandlers } from '../../../src/engine/handlers/host-control.handler.js';
import { SessionFlusher } from '../../../src/engine/persistence/session-flusher.js';
import { RoomStateManager } from '../../../src/engine/state/room-state.manager.js';
import { setupMockRedis } from '../../helpers/mock-redis.js';
import * as dbModule from '../../../src/db/index.js';

describe('Game Handlers & Flusher Comprehensive Branch Tests', () => {
  beforeEach(async () => {
    const redis = setupMockRedis();
    await redis.flushall();
  });

  function createMockSocket(playerId?: string) {
    const handlers: Record<string, Function> = {};
    const emitted: Record<string, any[]> = {};

    const socket: any = {
      id: 'mock-socket-id-1',
      playerId,
      join: vi.fn(),
      leave: vi.fn(),
      on: vi.fn((event: string, handler: Function) => {
        handlers[event] = handler;
      }),
      emit: vi.fn((event: string, data: any) => {
        if (!emitted[event]) emitted[event] = [];
        emitted[event].push(data);
      }),
    };

    const io: any = {
      to: vi.fn().mockReturnValue({
        emit: vi.fn(),
      }),
    };

    return { socket, io, handlers, emitted };
  }

  describe('SessionFlusher Branch Coverage', () => {
    it('returns early when room metadata is missing', async () => {
      const mockDb: any = { update: vi.fn() };
      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb);

      await SessionFlusher.flushSessionToDatabase('000000', 'FINISHED');
      expect(mockDb.update).not.toHaveBeenCalled();
    });

    it('flushes session with answered and skipped questions correctly', async () => {
      const pin = '123456';
      const sessionId = '00000000-0000-0000-0000-000000000001';
      const playerId = 'player-1';
      const q1 = '00000000-0000-0000-0000-000000000010';
      const q2 = '00000000-0000-0000-0000-000000000020';

      await RoomStateManager.setRoomMeta(pin, {
        sessionId,
        professorId: 'prof-1',
        quizId: 'quiz-1',
        pin,
        status: 'QUESTION_ACTIVE',
        currentQuestionIndex: 1,
        totalQuestions: 2,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      await RoomStateManager.addPlayer(pin, {
        id: playerId,
        nickname: 'Alice',
        socketId: 'sock-1',
        connected: true,
        joinedAt: Date.now(),
      });

      // Player answers q1, skips q2
      await RoomStateManager.submitAnswerAtomic(
        pin,
        q1,
        playerId,
        {
          optionId: 'opt-1',
          responseTimeMs: 1200,
          isCorrect: true,
          pointsEarned: 950,
        },
        950
      );

      const mockDb: any = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue([]),
        }),
      };
      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb);

      await SessionFlusher.flushSessionToDatabase(pin, 'FINISHED', [q1, q2]);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('HostControlHandler Branch Coverage', () => {
    it('handles room:close when room exists vs when room is missing', async () => {
      const { socket, io, handlers, emitted } = createMockSocket();
      registerHostControlHandlers(io, socket);

      // Missing room
      await handlers['room:close']({ pin: '000000' });

      // Existing room
      const pin = '654321';
      await RoomStateManager.setRoomMeta(pin, {
        sessionId: '00000000-0000-0000-0000-000000000001',
        professorId: 'prof-1',
        quizId: 'quiz-1',
        pin,
        status: 'LOBBY',
        currentQuestionIndex: -1,
        totalQuestions: 1,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      const mockDb: any = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([]),
          }),
        }),
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb);

      await handlers['room:close']({ pin });
      expect(io.to).toHaveBeenCalledWith(pin);
    });
  });

  describe('LobbyHandler Branch Coverage', () => {
    it('validates pin and nickname during room:join', async () => {
      const { socket, io, handlers, emitted } = createMockSocket();
      registerLobbyHandlers(io, socket);

      // Invalid PIN length
      await handlers['room:join']({ pin: '123', nickname: 'Alice' });
      expect(emitted['room:error'][0].code).toBe('INVALID_PIN');

      // Invalid Nickname (empty)
      await handlers['room:join']({ pin: '123456', nickname: '   ' });
      expect(emitted['room:error'][1].code).toBe('INVALID_NICKNAME');

      // Room not found
      await handlers['room:join']({ pin: '999999', nickname: 'Alice' });
      expect(emitted['room:error'][2].code).toBe('ROOM_NOT_FOUND');

      // Room locked / active
      const pin = '888999';
      await RoomStateManager.setRoomMeta(pin, {
        sessionId: '00000000-0000-0000-0000-000000000001',
        professorId: 'prof-1',
        quizId: 'quiz-1',
        pin,
        status: 'QUESTION_ACTIVE',
        currentQuestionIndex: 0,
        totalQuestions: 1,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      await handlers['room:join']({ pin, nickname: 'Alice' });
      expect(emitted['room:error'][3].code).toBe('GAME_ALREADY_STARTED');
    });

    it('rejects room:create when quiz does not exist or has 0 questions', async () => {
      const { socket, io, handlers, emitted } = createMockSocket();
      registerLobbyHandlers(io, socket);

      // Quiz not found
      const mockDbNotFound: any = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDbNotFound);

      await handlers['room:create']({ quizId: '00000000-0000-0000-0000-000000000001' });
      expect(emitted['room:error'][0].code).toBe('QUIZ_NOT_FOUND');

      // Quiz has 0 questions
      let selectCount = 0;
      const mockDbZeroQ: any = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              selectCount++;
              if (selectCount === 1) {
                return { limit: vi.fn().mockResolvedValue([{ id: 'quiz-1', themeId: null }]) };
              }
              return Promise.resolve([]); // 0 questions
            }),
          }),
        })),
      };
      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDbZeroQ);

      await handlers['room:create']({ quizId: '00000000-0000-0000-0000-000000000001' });
      expect(emitted['room:error'][1].code).toBe('NO_QUESTIONS');
    });

    it('creates room successfully with active theme and custom duration', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerLobbyHandlers(io, socket);

      let selectCount = 0;
      const mockTheme = {
        primaryColor: '#000000',
        secondaryColor: '#ffffff',
        backgroundColor: '#f0f0f0',
        fontFamily: 'Roboto',
        logoUrl: 'https://example.com/logo.png',
      };
      const mockDb: any = {
        select: vi.fn().mockImplementation(() => ({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockImplementation(() => {
              selectCount++;
              if (selectCount === 1) {
                return { limit: vi.fn().mockResolvedValue([{ id: 'quiz-1', professorId: 'prof-1', themeId: null }]) };
              }
              if (selectCount === 2) {
                return Promise.resolve([{ id: 'q-1' }]);
              }
              return { limit: vi.fn().mockResolvedValue([mockTheme]) };
            }),
          }),
        })),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'session-uuid-theme' }]),
          }),
        }),
      };
      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb);

      const callback = vi.fn();
      await handlers['room:create'](
        { quizId: '00000000-0000-0000-0000-000000000001', themeId: 'theme-custom', durationMinutes: 45 },
        callback
      );

      expect(socket.emit).toHaveBeenCalledWith('room:created', expect.objectContaining({ theme: expect.any(Object) }));
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ data: expect.anything() }));
    });

    it('returns early in room:kick_player if player does not exist', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerLobbyHandlers(io, socket);

      await handlers['room:kick_player']({ pin: '123456', playerId: 'nonexistent-player' });
      expect(io.to).not.toHaveBeenCalled();
    });
  });

  describe('GameFlowHandler Branch Coverage', () => {
    it('validates submission state in question:submit_answer', async () => {
      // Without playerId on socket -> UNAUTHORIZED
      const { socket, io, handlers, emitted } = createMockSocket();
      registerGameFlowHandlers(io, socket);

      await handlers['question:submit_answer']({
        pin: '123456',
        questionId: 'q-1',
        optionId: 'opt-1',
      });
      expect(emitted['room:error'][0].code).toBe('UNAUTHORIZED');

      // With playerId, but question not active -> QUESTION_NOT_ACTIVE
      const pupil = createMockSocket('player-uuid-1');
      registerGameFlowHandlers(pupil.io, pupil.socket);

      const pin = '555666';
      await RoomStateManager.setRoomMeta(pin, {
        sessionId: '00000000-0000-0000-0000-000000000001',
        professorId: 'prof-1',
        quizId: 'quiz-1',
        pin,
        status: 'LOBBY',
        currentQuestionIndex: -1,
        totalQuestions: 1,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      await pupil.handlers['question:submit_answer']({
        pin,
        questionId: 'q-1',
        optionId: 'opt-1',
      });
      expect(pupil.emitted['room:error'][0].code).toBe('QUESTION_NOT_ACTIVE');
    });

    it('handles incorrect answer submission and streak reset', async () => {
      const pupil = createMockSocket('player-uuid-2');
      registerGameFlowHandlers(pupil.io, pupil.socket);

      const pin = '444555';
      const qId = '00000000-0000-0000-0000-000000000010';
      const wrongOptId = '00000000-0000-0000-0000-000000000021';

      await RoomStateManager.setRoomMeta(pin, {
        sessionId: '00000000-0000-0000-0000-000000000001',
        professorId: 'prof-1',
        quizId: 'quiz-1',
        pin,
        status: 'QUESTION_ACTIVE',
        currentQuestionIndex: 0,
        questionStartTimeMs: Date.now() - 1000,
        questionTimeLimitMs: 20000,
        questionBasePoints: 1000,
        totalQuestions: 1,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      await RoomStateManager.setStreak(pin, 'player-uuid-2', 3);

      const mockDb: any = {
        select: vi.fn().mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([{ id: wrongOptId, isCorrect: false }]),
            }),
          }),
        }),
      };
      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb);

      await pupil.handlers['question:submit_answer']({
        pin,
        questionId: qId,
        optionId: wrongOptId,
      });

      expect(pupil.emitted['question:result_pupil']).toBeDefined();
      const result = pupil.emitted['question:result_pupil'][0];
      expect(result.isCorrect).toBe(false);
      expect(result.pointsEarned).toBe(0);
      expect(result.streak).toBe(0);

      // Second submission -> DUPLICATE_ANSWER
      await pupil.handlers['question:submit_answer']({
        pin,
        questionId: qId,
        optionId: wrongOptId,
      });
      expect(pupil.emitted['room:error'][0].code).toBe('DUPLICATE_ANSWER');
    });

    it('handles game:start, game:show_leaderboard, question:show_result, game:end when room missing', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerGameFlowHandlers(io, socket);

      await handlers['game:start']({ pin: '000000' });
      await handlers['game:show_leaderboard']({ pin: '000000' });
      await handlers['question:show_result']({ pin: '000000' });
      await handlers['game:next_question']({ pin: '000000' });
      await handlers['game:end']({ pin: '000000' });

      expect(io.to).not.toHaveBeenCalled();
    });

    it('advances to next question countdown when more questions remain', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerGameFlowHandlers(io, socket);

      const pin = '333444';
      await RoomStateManager.setRoomMeta(pin, {
        sessionId: '00000000-0000-0000-0000-000000000001',
        professorId: 'prof-1',
        quizId: 'quiz-1',
        pin,
        status: 'QUESTION_ACTIVE',
        currentQuestionIndex: 0,
        totalQuestions: 3, // 3 questions, so nextIndex (1) < 3!
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      await handlers['game:next_question']({ pin });
      expect(io.to).toHaveBeenCalledWith(pin);

      const meta = await RoomStateManager.getRoomMeta(pin);
      expect(meta?.status).toBe('COUNTDOWN');
      expect(meta?.currentQuestionIndex).toBe(1);
    });

    it('emits NEXT_FAILED when game:next_question encounters an unexpected error', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerGameFlowHandlers(io, socket);

      vi.spyOn(RoomStateManager, 'getRoomMeta').mockRejectedValueOnce(new Error('State store corrupted'));
      await handlers['game:next_question']({ pin: '123123' });
      expect(socket.emit).toHaveBeenCalledWith('room:error', expect.objectContaining({ code: 'NEXT_FAILED' }));
    });

    it('emits END_FAILED when game:end encounters an unexpected error', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerGameFlowHandlers(io, socket);

      vi.spyOn(RoomStateManager, 'getRoomMeta').mockRejectedValueOnce(new Error('DB failure'));
      await handlers['game:end']({ pin: '123123' });
      expect(socket.emit).toHaveBeenCalledWith('room:error', expect.objectContaining({ code: 'END_FAILED' }));
    });
  });

  describe('Host Control & Lobby Error Branches', () => {
    it('emits CLOSE_FAILED when room:close encounters an unexpected error', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerHostControlHandlers(io, socket);

      vi.spyOn(RoomStateManager, 'getRoomMeta').mockRejectedValueOnce(new Error('Redis crash'));
      await handlers['room:close']({ pin: '999999' });
      expect(socket.emit).toHaveBeenCalledWith('room:error', expect.objectContaining({ code: 'CLOSE_FAILED' }));
    });

    it('emits KICK_FAILED when room:kick_player encounters an unexpected error', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerLobbyHandlers(io, socket);

      vi.spyOn(RoomStateManager, 'getPlayer').mockRejectedValueOnce(new Error('Redis failure'));
      await handlers['room:kick_player']({ pin: '999999', playerId: 'p1' });
      expect(socket.emit).toHaveBeenCalledWith('room:error', expect.objectContaining({ code: 'KICK_FAILED' }));
    });

    it('invokes ack callback on room:join success', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerLobbyHandlers(io, socket);

      const pin = '555666';
      await RoomStateManager.setRoomMeta(pin, {
        sessionId: 'sess-uuid',
        professorId: 'prof-1',
        quizId: 'quiz-1',
        pin,
        status: 'LOBBY',
        currentQuestionIndex: 0,
        totalQuestions: 1,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      const ackCallback = vi.fn();
      await handlers['room:join']({ pin, nickname: 'Alice' }, ackCallback);
      expect(ackCallback).toHaveBeenCalledWith(expect.objectContaining({ data: expect.anything() }));
    });
  });

  describe('Empty Answer & Execution Mode Tests', () => {
    it('handles empty answer submission when optionId is null or empty', async () => {
      const { socket, io, handlers } = createMockSocket('player-empty');
      registerGameFlowHandlers(io, socket);

      const pin = '777888';
      const questionId = 'q-empty-1';
      await RoomStateManager.setRoomMeta(pin, {
        sessionId: 'sess-empty',
        professorId: 'prof-1',
        quizId: 'quiz-empty',
        pin,
        status: 'QUESTION_ACTIVE',
        currentQuestionIndex: 0,
        totalQuestions: 1,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
        questionStartTimeMs: Date.now(),
        questionTimeLimitMs: 20000,
        questionBasePoints: 1000,
      });

      await RoomStateManager.addPlayer(pin, {
        id: 'player-empty',
        nickname: 'Tardy',
        socketId: 'sock-1',
        connected: true,
        joinedAt: Date.now(),
      });

      const callback = vi.fn();
      await handlers['question:submit_answer'](
        { pin, questionId, optionId: null },
        callback
      );

      expect(socket.emit).toHaveBeenCalledWith(
        'question:result_pupil',
        expect.objectContaining({
          isCorrect: false,
          pointsEarned: 0,
          isEmpty: true,
        })
      );

      const answers = await RoomStateManager.getAnswersForQuestion(pin, questionId);
      expect(answers['player-empty']).toMatchObject({
        isCorrect: false,
        pointsEarned: 0,
        isEmpty: true,
      });
    });

    it('emits question:result_host with emptyCount for unanswered players', async () => {
      const { socket, io, handlers } = createMockSocket();
      registerGameFlowHandlers(io, socket);

      const pin = '888999';
      const quizId = 'quiz-res-1';
      const questionId = 'q-res-1';

      await RoomStateManager.setRoomMeta(pin, {
        sessionId: 'sess-res',
        professorId: 'prof-1',
        quizId,
        pin,
        status: 'QUESTION_ACTIVE',
        currentQuestionIndex: 0,
        totalQuestions: 1,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      // Mock database returning 1 question and 2 options
      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        offset: vi.fn().mockImplementation(() => [
          {
            id: questionId,
            quizId,
            orderIndex: 0,
            questionText: 'Test?',
            questionType: 'MULTIPLE_CHOICE',
            timeLimitSeconds: 20,
            pointsMultiplier: '1.00',
            mediaUrl: null,
            showAnswersOnDevice: false,
          },
        ]),
      };

      // Mock second call for options
      let callCount = 0;
      mockDb.orderBy = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue([
                {
                  id: questionId,
                  quizId,
                  orderIndex: 0,
                  questionText: 'Test?',
                  questionType: 'MULTIPLE_CHOICE',
                  timeLimitSeconds: 20,
                  pointsMultiplier: '1.00',
                },
              ]),
            }),
          };
        }
        return [
          { id: 'opt-1', questionId, orderIndex: 0, optionText: 'Opt 1', isCorrect: true },
          { id: 'opt-2', questionId, orderIndex: 1, optionText: 'Opt 2', isCorrect: false },
        ];
      });

      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb);

      await RoomStateManager.addPlayer(pin, {
        id: 'p-answered',
        nickname: 'Alice',
        socketId: 's-1',
        connected: true,
        joinedAt: Date.now(),
      });
      await RoomStateManager.addPlayer(pin, {
        id: 'p-unanswered',
        nickname: 'Bob',
        socketId: 's-2',
        connected: true,
        joinedAt: Date.now(),
      });

      // Submit answer for Alice
      await RoomStateManager.submitAnswerAtomic(
        pin,
        questionId,
        'p-answered',
        { optionId: 'opt-1', responseTimeMs: 1000, isCorrect: true, pointsEarned: 1000 },
        1000
      );

      await handlers['question:show_result']({ pin });

      expect(io.to(pin).emit).toHaveBeenCalledWith(
        'question:result_host',
        expect.objectContaining({
          questionId,
          emptyCount: 1,
          answeredCount: 2,
          totalPlayers: 2,
          distribution: expect.objectContaining({
            'opt-1': 1,
            'opt-2': 0,
            '__EMPTY__': 1,
          }),
        })
      );
    });

    it('in MANUAL mode: automatically pauses and reveals results when all players have answered', async () => {
      const pupil = createMockSocket('p-manual-1');
      registerGameFlowHandlers(pupil.io, pupil.socket);

      const pin = '999111';
      const quizId = 'quiz-manual';
      const questionId = 'q-manual-1';

      await RoomStateManager.setRoomMeta(pin, {
        sessionId: 'sess-manual',
        professorId: 'prof-1',
        quizId,
        pin,
        status: 'QUESTION_ACTIVE',
        executionMode: 'MANUAL',
        currentQuestionIndex: 0,
        totalQuestions: 2,
        questionStartTimeMs: Date.now(),
        questionTimeLimitMs: 20000,
        questionBasePoints: 1000,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      await RoomStateManager.addPlayer(pin, {
        id: 'p-manual-1',
        nickname: 'Alice',
        socketId: 's-1',
        connected: true,
        joinedAt: Date.now(),
      });

      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };

      let callCount = 0;
      mockDb.orderBy = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue([
                {
                  id: questionId,
                  quizId,
                  orderIndex: 0,
                  questionText: 'Test?',
                  questionType: 'MULTIPLE_CHOICE',
                  timeLimitSeconds: 20,
                  pointsMultiplier: '1.00',
                },
              ]),
            }),
          };
        }
        return [
          { id: 'opt-1', questionId, orderIndex: 0, optionText: 'Opt 1', isCorrect: true },
        ];
      });

      mockDb.where = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: 'opt-1', isCorrect: true }]),
        orderBy: mockDb.orderBy,
      });

      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb);

      await pupil.handlers['question:submit_answer']({
        pin,
        questionId,
        optionId: 'opt-1',
      });

      // All players (1/1) answered in MANUAL mode -> room status should be QUESTION_RESULT automatically
      const meta = await RoomStateManager.getRoomMeta(pin);
      expect(meta?.status).toBe('QUESTION_RESULT');
      expect(pupil.io.to(pin).emit).toHaveBeenCalledWith(
        'question:result_host',
        expect.objectContaining({
          questionId,
          answeredCount: 1,
          totalPlayers: 1,
        })
      );
    });

    it('in AUTOMATIC mode: reaches PODIUM on last question without prematurely emitting game:ended', async () => {
      const pupil = createMockSocket('p-auto-1');
      registerGameFlowHandlers(pupil.io, pupil.socket);

      const pin = '999222';
      const quizId = 'quiz-auto-podium';
      const questionId = 'q-auto-last';

      await RoomStateManager.setRoomMeta(pin, {
        sessionId: 'sess-auto-podium',
        professorId: 'prof-1',
        quizId,
        pin,
        status: 'QUESTION_ACTIVE',
        executionMode: 'AUTOMATIC',
        currentQuestionIndex: 0,
        totalQuestions: 1, // Only 1 question, so finishing it reaches PODIUM!
        questionStartTimeMs: Date.now(),
        questionTimeLimitMs: 20000,
        questionBasePoints: 1000,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });

      await RoomStateManager.addPlayer(pin, {
        id: 'p-auto-1',
        nickname: 'Alice',
        socketId: 's-1',
        connected: true,
        joinedAt: Date.now(),
      });

      const mockDb: any = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
      };

      let callCount = 0;
      mockDb.orderBy = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            limit: vi.fn().mockReturnValue({
              offset: vi.fn().mockReturnValue([
                {
                  id: questionId,
                  quizId,
                  orderIndex: 0,
                  questionText: 'Test?',
                  questionType: 'MULTIPLE_CHOICE',
                  timeLimitSeconds: 20,
                  pointsMultiplier: '1.00',
                },
              ]),
            }),
          };
        }
        return [
          { id: 'opt-1', questionId, orderIndex: 0, optionText: 'Opt 1', isCorrect: true },
        ];
      });

      mockDb.where = vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([{ id: 'opt-1', isCorrect: true }]),
        orderBy: mockDb.orderBy,
      });

      vi.spyOn(dbModule, 'getDb').mockReturnValue(mockDb);

      await pupil.handlers['question:submit_answer']({
        pin,
        questionId,
        optionId: 'opt-1',
      });

      // In AUTOMATIC mode when last question completes:
      // Status must be PODIUM, game:podium emitted, but NOT game:ended!
      const meta = await RoomStateManager.getRoomMeta(pin);
      expect(meta?.status).toBe('PODIUM');
      expect(pupil.io.to(pin).emit).toHaveBeenCalledWith(
        'game:podium',
        expect.objectContaining({
          podium: expect.any(Array),
          totalPlayers: 1,
        })
      );
      expect(pupil.io.to(pin).emit).not.toHaveBeenCalledWith('game:ended', expect.anything());
    });
  });
});

