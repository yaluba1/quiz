import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadConfig } from '../../../src/config/env.js';

describe('Config Loader Unit Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('loads default configuration when environment variables are not set', () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.DB_SSL;
    delete process.env.REDIS_PASSWORD;

    const conf = loadConfig();
    expect(conf.port).toBe(4000);
    expect(conf.host).toBe('0.0.0.0');
    expect(conf.db.ssl).toBeUndefined();
    expect(conf.redis.password).toBeUndefined();
  });

  it('loads custom environment variables when provided', () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '8080';
    process.env.HOST = '127.0.0.1';
    process.env.API_PREFIX = '/v1';
    process.env.CORS_ORIGIN = 'https://quiz.example.com';
    process.env.DB_HOST = 'postgres.internal';
    process.env.DB_PORT = '5433';
    process.env.DB_NAME = 'custom_db';
    process.env.DB_USER = 'custom_user';
    process.env.DB_PASSWORD = 'custom_password';
    process.env.DB_SSL = 'true';
    process.env.DB_MAX_CONNECTIONS = '50';
    process.env.DB_IDLE_TIMEOUT_MS = '10000';
    process.env.REDIS_HOST = 'redis.internal';
    process.env.REDIS_PORT = '6380';
    process.env.REDIS_PASSWORD = 'secret_redis_pass';
    process.env.REDIS_DB = '3';
    process.env.AUTH_PROVIDER = 'supabase';
    process.env.JWT_SECRET = 'custom_jwt_secret_value_12345';
    process.env.JWT_ACCESS_EXPIRES_IN = '30m';
    process.env.JWT_REFRESH_EXPIRES_IN = '14d';
    process.env.HANKO_API_URL = 'https://hanko.example.com';
    process.env.SUPABASE_URL = 'https://supabase.example.com';
    process.env.SUPABASE_JWT_SECRET = 'supabase_secret';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service_role_key';

    const conf = loadConfig();
    expect(conf.nodeEnv).toBe('production');
    expect(conf.port).toBe(8080);
    expect(conf.host).toBe('127.0.0.1');
    expect(conf.apiPrefix).toBe('/v1');
    expect(conf.corsOrigin).toBe('https://quiz.example.com');
    expect(conf.db.host).toBe('postgres.internal');
    expect(conf.db.port).toBe(5433);
    expect(conf.db.database).toBe('custom_db');
    expect(conf.db.user).toBe('custom_user');
    expect(conf.db.password).toBe('custom_password');
    expect(conf.db.ssl).toEqual({ rejectUnauthorized: false });
    expect(conf.db.maxConnections).toBe(50);
    expect(conf.db.idleTimeoutMillis).toBe(10000);
    expect(conf.redis.host).toBe('redis.internal');
    expect(conf.redis.port).toBe(6380);
    expect(conf.redis.password).toBe('secret_redis_pass');
    expect(conf.redis.db).toBe(3);
    expect(conf.auth.provider).toBe('supabase');
    expect(conf.auth.jwtSecret).toBe('custom_jwt_secret_value_12345');
    expect(conf.auth.accessExpiresIn).toBe('30m');
    expect(conf.auth.refreshExpiresIn).toBe('14d');
    expect(conf.auth.hankoApiUrl).toBe('https://hanko.example.com');
    expect(conf.auth.supabaseUrl).toBe('https://supabase.example.com');
  });
});

