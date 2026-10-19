import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExpirationTracker } from '../../../src/engine/state/expiration-tracker.js';
import { setupMockRedis } from '../../helpers/mock-redis.js';
import { RoomStateManager } from '../../../src/engine/state/room-state.manager.js';
import { REDIS_KEYS } from '../../../src/redis/keys.js';
import { SessionFlusher } from '../../../src/engine/persistence/session-flusher.js';

describe('ExpirationTracker Unit Tests', () => {
  beforeEach(async () => {
    const redis = setupMockRedis();
    await redis.flushall();
    vi.spyOn(SessionFlusher, 'flushSessionToDatabase').mockResolvedValue();
  });

  afterEach(() => {
    ExpirationTracker.stopScheduler();
    vi.restoreAllMocks();
  });

  it('detects and expires rooms whose expiresAt has passed', async () => {
    const pin = '888888';
    const expiredMeta = {
      sessionId: 'sess-uuid-expired',
      professorId: 'prof-uuid',
      quizId: 'quiz-uuid',
      pin,
      status: 'LOBBY' as const,
      currentQuestionIndex: -1,
      totalQuestions: 5,
      expiresAt: new Date(Date.now() - 10000).toISOString(), // expired in past
    };

    await RoomStateManager.setRoomMeta(pin, expiredMeta);

    const emitFn = vi.fn();
    const mockIo: any = {
      to: vi.fn().mockReturnValue({ emit: emitFn }),
    };

    vi.spyOn(SessionFlusher, 'flushSessionToDatabase').mockResolvedValue();

    const expiredPins = await ExpirationTracker.checkExpiredRooms(mockIo);

    expect(expiredPins).toContain(pin);
    expect(mockIo.to).toHaveBeenCalledWith(pin);
    expect(emitFn).toHaveBeenCalledWith('room:expired', expect.any(Object));
    expect(SessionFlusher.flushSessionToDatabase).toHaveBeenCalledWith(pin, 'EXPIRED');
  });

  it('starts and stops background interval timer', () => {
    vi.useFakeTimers();
    const mockIo: any = { to: vi.fn().mockReturnValue({ emit: vi.fn() }) };
    vi.spyOn(ExpirationTracker, 'checkExpiredRooms').mockResolvedValue([]);

    ExpirationTracker.startScheduler(mockIo, 1000);
    // Call startScheduler again (idempotent)
    ExpirationTracker.startScheduler(mockIo, 1000);

    vi.advanceTimersByTime(1500);
    expect(ExpirationTracker.checkExpiredRooms).toHaveBeenCalled();

    ExpirationTracker.stopScheduler();
    vi.useRealTimers();
  });

  it('removes stale or already finished rooms from active list', async () => {
    const pinMissing = '111111';
    const pinFinished = '222222';

    await RoomStateManager.setRoomMeta(pinFinished, {
      sessionId: 'sess-uuid-finished',
      professorId: 'prof-uuid',
      quizId: 'quiz-uuid',
      pin: pinFinished,
      status: 'FINISHED' as const,
      currentQuestionIndex: -1,
      totalQuestions: 5,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    });

    // Manually add pinMissing to active set
    const redis = (await import('../../../src/redis/client.js')).getRedisClient();
    await redis.sadd(REDIS_KEYS.activeRooms(), pinMissing);

    const mockIo: any = { to: vi.fn().mockReturnValue({ emit: vi.fn() }) };
    const expiredPins = await ExpirationTracker.checkExpiredRooms(mockIo);
    expect(expiredPins).toHaveLength(0);

    const activeRooms = await redis.smembers(REDIS_KEYS.activeRooms());
    expect(activeRooms).not.toContain(pinMissing);
    expect(activeRooms).not.toContain(pinFinished);
  });
});

