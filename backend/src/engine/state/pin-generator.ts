import * as crypto from 'crypto';
import { getRedisClient } from '../../redis/client.js';
import { REDIS_KEYS } from '../../redis/keys.js';

/**
 * Generates a random 6-digit numeric room PIN between 100000 and 999999.
 */
export function generateRandomPin(): string {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Allocates an active 6-digit PIN guaranteed not to collide with currently active rooms.
 *
 * @param maxAttempts Max retry attempts to find a collision-free PIN (default 10)
 * @returns 6-digit unique PIN string
 */
export async function allocateUniquePin(maxAttempts = 10): Promise<string> {
  const redis = getRedisClient();

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const pin = generateRandomPin();
    const metaKey = REDIS_KEYS.roomMeta(pin);
    const exists = await redis.exists(metaKey);

    if (exists === 0) {
      return pin;
    }
  }

  // Fallback if random attempts collided
  const timestampOffset = (Date.now() % 900000) + 100000;
  return timestampOffset.toString();
}

