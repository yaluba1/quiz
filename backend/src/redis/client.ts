import { Redis, RedisOptions } from 'ioredis';
import { config } from '../config/env.js';

let defaultRedisClient: Redis | null = null;
let pubClientInstance: Redis | null = null;
let subClientInstance: Redis | null = null;

export function getRedisOptions(customOptions?: Partial<RedisOptions>): RedisOptions {
  return {
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    db: config.redis.db,
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    ...customOptions,
  };
}

export function createRedisClient(customOptions?: Partial<RedisOptions>): Redis {
  const options = getRedisOptions(customOptions);
  const client = new Redis(options);

  client.on('error', (err) => {
    // Only log error in non-test environments or when debugging
    if (config.nodeEnv !== 'test') {
      console.error('[Redis] Connection error:', err.message);
    }
  });

  return client;
}

export function getRedisClient(): Redis {
  if (!defaultRedisClient) {
    defaultRedisClient = createRedisClient();
  }
  return defaultRedisClient;
}

export function setRedisClient(client: Redis | null): void {
  defaultRedisClient = client;
}

export function getPubSubClients(): { pubClient: Redis; subClient: Redis } {
  if (!pubClientInstance) {
    pubClientInstance = createRedisClient();
  }
  if (!subClientInstance) {
    subClientInstance = createRedisClient();
  }
  return { pubClient: pubClientInstance, subClient: subClientInstance };
}

export async function closeRedis(): Promise<void> {
  const clients = [defaultRedisClient, pubClientInstance, subClientInstance].filter(
    (c): c is Redis => c !== null
  );

  await Promise.all(
    clients.map(async (client) => {
      try {
        await client.quit();
      } catch {
        client.disconnect();
      }
    })
  );

  defaultRedisClient = null;
  pubClientInstance = null;
  subClientInstance = null;
}

