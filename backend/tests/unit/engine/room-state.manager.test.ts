import { describe, it, expect, beforeEach } from 'vitest';
import { setupMockRedis } from '../../helpers/mock-redis.js';
import { RoomStateManager } from '../../../src/engine/state/room-state.manager.js';
import { RoomMeta, PlayerSession } from '../../../src/engine/types.js';

describe('RoomStateManager', () => {
  const pin = '123456';
  const dummyMeta: RoomMeta = {
    sessionId: 'sess-uuid-1',
    professorId: 'prof-uuid-1',
    quizId: 'quiz-uuid-1',
    pin,
    status: 'LOBBY',
    currentQuestionIndex: -1,
    totalQuestions: 5,
    expiresAt: new Date(Date.now() + 3600000).toISOString(),
  };

  beforeEach(() => {
    setupMockRedis();
  });

  it('stores and retrieves room metadata', async () => {
    await RoomStateManager.setRoomMeta(pin, dummyMeta);
    const retrieved = await RoomStateManager.getRoomMeta(pin);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.pin).toBe(pin);
    expect(retrieved?.sessionId).toBe(dummyMeta.sessionId);
    expect(retrieved?.status).toBe('LOBBY');
    expect(retrieved?.totalQuestions).toBe(5);
  });

  it('returns null if room does not exist', async () => {
    const nonExistent = await RoomStateManager.getRoomMeta('999999');
    expect(nonExistent).toBeNull();
  });

  it('updates room metadata partially', async () => {
    await RoomStateManager.setRoomMeta(pin, dummyMeta);
    await RoomStateManager.updateRoomMeta(pin, {
      status: 'QUESTION_ACTIVE',
      currentQuestionIndex: 1,
      questionBasePoints: 1000,
    });

    const updated = await RoomStateManager.getRoomMeta(pin);
    expect(updated?.status).toBe('QUESTION_ACTIVE');
    expect(updated?.currentQuestionIndex).toBe(1);
    expect(updated?.questionBasePoints).toBe(1000);
  });

  it('adds, retrieves, and lists players', async () => {
    const player1: PlayerSession = {
      id: 'p1',
      nickname: 'Alice',
      socketId: 'sock1',
      connected: true,
      joinedAt: Date.now(),
    };
    const player2: PlayerSession = {
      id: 'p2',
      nickname: 'Bob',
      socketId: 'sock2',
      connected: true,
      joinedAt: Date.now(),
    };

    await RoomStateManager.addPlayer(pin, player1);
    await RoomStateManager.addPlayer(pin, player2);

    const retrieved1 = await RoomStateManager.getPlayer(pin, 'p1');
    expect(retrieved1?.nickname).toBe('Alice');

    const allPlayers = await RoomStateManager.getAllPlayers(pin);
    expect(allPlayers).toHaveLength(2);
    expect(allPlayers.map((p) => p.nickname).sort()).toEqual(['Alice', 'Bob']);

    // Remove player
    await RoomStateManager.removePlayer(pin, 'p1');
    const afterRemoval = await RoomStateManager.getAllPlayers(pin);
    expect(afterRemoval).toHaveLength(1);
    expect(afterRemoval[0].nickname).toBe('Bob');
  });

  it('tracks player streaks', async () => {
    expect(await RoomStateManager.getStreak(pin, 'p1')).toBe(0);

    await RoomStateManager.setStreak(pin, 'p1', 3);
    expect(await RoomStateManager.getStreak(pin, 'p1')).toBe(3);
  });
});

