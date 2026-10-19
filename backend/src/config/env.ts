import * as dotenv from 'dotenv';
import { readSecretOrEnv } from './secrets.js';

dotenv.config();

export type AuthProviderType = 'self_hosted' | 'hanko' | 'supabase';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  apiPrefix: string;
  corsOrigin: string | boolean | string[];
  db: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
    maxConnections: number;
    idleTimeoutMillis: number;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
  };
  appUrl: string;
  smtp: {
    host: string;
    port: number;
    user: string;
    password: string;
    from: string;
    secure: boolean;
    requireTLS?: boolean;
  };
  auth: {
    provider: AuthProviderType;
    jwtSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
    hankoApiUrl?: string;
    supabaseUrl?: string;
    supabaseJwtSecret?: string;
    supabaseServiceRoleKey?: string;
  };
  storage: {
    endpoint: string;
    bucket: string;
    region: string;
    publicUrl: string;
    accessKey: string;
    secretKey: string;
  };
}

export function loadConfig(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';
  const apiPrefix = process.env.API_PREFIX || '/api';

  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
  const dbName = process.env.DB_NAME || process.env.POSTGRES_DB || 'quiz_db';
  const dbUser = readSecretOrEnv(
    process.env.DB_USER_FILE || '/run/secrets/db_user',
    process.env.DB_USER,
    'quiz_admin'
  );
  const dbPassword = readSecretOrEnv(
    process.env.DB_PASSWORD_FILE || '/run/secrets/db_password',
    process.env.DB_PASSWORD,
    'quiz_secure_password_123'
  );
  const dbSsl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
  const dbMaxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10);
  const dbIdleTimeoutMillis = parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10);

  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
  const redisPassword = readSecretOrEnv(
    process.env.REDIS_PASSWORD_FILE || '/run/secrets/redis_password',
    process.env.REDIS_PASSWORD,
    ''
  );
  const redisDb = parseInt(process.env.REDIS_DB || '0', 10);

  const authProvider = (process.env.AUTH_PROVIDER || 'self_hosted') as AuthProviderType;
  const jwtSecret = readSecretOrEnv(
    process.env.JWT_SECRET_FILE || '/run/secrets/jwt_secret',
    process.env.JWT_SECRET,
    'dev_jwt_super_secret_signing_key_change_in_production_12345'
  );
  const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
  const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

  const appUrl = process.env.APP_URL || (process.env.DOMAIN ? `https://${process.env.DOMAIN}` : 'http://localhost:3000');

  const smtpHost = readSecretOrEnv(
    process.env.SMTP_HOST_FILE || '/run/secrets/smtp_host',
    process.env.SMTP_HOST,
    ''
  );
  const smtpPort = parseInt(
    readSecretOrEnv(
      process.env.SMTP_PORT_FILE || '/run/secrets/smtp_port',
      process.env.SMTP_PORT,
      '587'
    ),
    10
  );
  const smtpUser = readSecretOrEnv(
    process.env.SMTP_USER_FILE || '/run/secrets/smtp_user',
    process.env.SMTP_USER,
    ''
  );
  const smtpPassword = readSecretOrEnv(
    process.env.SMTP_PASSWORD_FILE || '/run/secrets/smtp_password',
    process.env.SMTP_PASSWORD,
    ''
  );
  const smtpFrom = readSecretOrEnv(
    process.env.SMTP_FROM_FILE || '/run/secrets/smtp_from',
    process.env.SMTP_FROM,
    'noreply@quiz.example.com'
  );
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const smtpRequireTls = process.env.SMTP_REQUIRE_TLS === 'true' || smtpPort === 587;

  const s3Endpoint = process.env.S3_ENDPOINT || 'http://garage:3900';
  const s3Bucket = process.env.S3_BUCKET || 'media';
  const s3Region = process.env.S3_REGION || 'garage';
  let s3PublicUrl = process.env.S3_PUBLIC_URL;
  if (!s3PublicUrl || s3PublicUrl.includes('${')) {
    s3PublicUrl = '/media';
  }
  const s3AccessKey = readSecretOrEnv(
    process.env.S3_ACCESS_KEY_FILE || '/run/secrets/garage_s3_key_id',
    process.env.S3_ACCESS_KEY || process.env.GARAGE_S3_KEY_ID,
    'GKopenquizkey01'
  );
  const s3SecretKey = readSecretOrEnv(
    process.env.S3_SECRET_KEY_FILE || '/run/secrets/garage_s3_secret_key',
    process.env.S3_SECRET_KEY || process.env.GARAGE_S3_SECRET_KEY,
    'default_dev_secret_key_2026!'
  );

  return {
    nodeEnv,
    port,
    host,
    apiPrefix,
    corsOrigin: process.env.CORS_ORIGIN || true,
    appUrl,
    smtp: {
      host: smtpHost,
      port: smtpPort,
      user: smtpUser,
      password: smtpPassword,
      from: smtpFrom,
      secure: smtpSecure,
      requireTLS: smtpRequireTls,
    },
    storage: {
      endpoint: s3Endpoint,
      bucket: s3Bucket,
      region: s3Region,
      publicUrl: s3PublicUrl,
      accessKey: s3AccessKey,
      secretKey: s3SecretKey,
    },
    db: {
      host: dbHost,
      port: dbPort,
      database: dbName,
      user: dbUser,
      password: dbPassword,
      ssl: dbSsl,
      maxConnections: dbMaxConnections,
      idleTimeoutMillis: dbIdleTimeoutMillis,
    },
    redis: {
      host: redisHost,
      port: redisPort,
      password: redisPassword.length > 0 ? redisPassword : undefined,
      db: redisDb,
    },
    auth: {
      provider: authProvider,
      jwtSecret,
      accessExpiresIn,
      refreshExpiresIn,
      hankoApiUrl: process.env.HANKO_API_URL,
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseJwtSecret: process.env.SUPABASE_JWT_SECRET,
      supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
  };
}

export const config = loadConfig();

