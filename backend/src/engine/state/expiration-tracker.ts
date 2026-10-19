import { Server } from 'socket.io';
import { getRedisClient } from '../../redis/client.js';
import { REDIS_KEYS } from '../../redis/keys.js';
import { RoomStateManager } from './room-state.manager.js';
import { SessionFlusher } from '../persistence/session-flusher.js';

let intervalTimer: NodeJS.Timeout | null = null;

export class ExpirationTracker {
  /**
   * Scans active rooms in Redis and auto-expires any whose expiresAt has passed.
   */
  static async checkExpiredRooms(io: Server): Promise<string[]> {
    const redis = getRedisClient();
    const activePins = await redis.smembers(REDIS_KEYS.activeRooms());
    const expiredPins: string[] = [];
    const now = Date.now();

    for (const pin of activePins) {
      const meta = await RoomStateManager.getRoomMeta(pin);
      if (!meta) {
        await redis.srem(REDIS_KEYS.activeRooms(), pin);
        continue;
      }

      if (meta.status === 'FINISHED' || meta.status === 'EXPIRED') {
        await redis.srem(REDIS_KEYS.activeRooms(), pin);
        continue;
      }

      const expiresTime = new Date(meta.expiresAt).getTime();
      if (!isNaN(expiresTime) && now >= expiresTime) {
        // Room has expired!
        expiredPins.push(pin);

        // Notify all sockets in room
        io.to(pin).emit('room:expired', {
          pin,
          reason: 'Quiz session has expired after time limit',
        });

        // Persist session as EXPIRED
        await SessionFlusher.flushSessionToDatabase(pin, 'EXPIRED');
      }
    }

    return expiredPins;
  }

  /**
   * Starts periodic background check for expired rooms.
   */
  static startScheduler(io: Server, intervalMs = 15000): void {
    if (intervalTimer) return;
    intervalTimer = setInterval(() => {
      this.checkExpiredRooms(io).catch((err) => {
        console.error('[ExpirationTracker] Error checking expired rooms:', err.message);
      });
    }, intervalMs);
  }

  /**
   * Stops background check.
   */
  static stopScheduler(): void {
    if (intervalTimer) {
      clearInterval(intervalTimer);
      intervalTimer = null;
    }
  }
}

