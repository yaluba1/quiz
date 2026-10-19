import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import * as schema from './schema/index';

dotenv.config();

const { Pool } = pg;

export function readSecretOrEnv(filePath?: string, envVar?: string, defaultValue = ''): string {
  if (filePath && fs.existsSync(filePath)) {
    try {
      const secret = fs.readFileSync(filePath, 'utf8').trim();
      if (secret.length > 0) return secret;
    } catch {
      // Fall back to environment variable
    }
  }
  return envVar || defaultValue;
}

export interface DbConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean | { rejectUnauthorized: boolean };
  maxConnections?: number;
  idleTimeoutMillis?: number;
}

export function getDbConfig(): DbConfig {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '5432', 10);
  const database = process.env.DB_NAME || process.env.POSTGRES_DB || 'quiz_db';
  const user = readSecretOrEnv(process.env.DB_USER_FILE || '/run/secrets/db_user', process.env.DB_USER, 'quiz_admin');
  const password = readSecretOrEnv(
    process.env.DB_PASSWORD_FILE || '/run/secrets/db_password',
    process.env.DB_PASSWORD,
    'quiz_secure_password_123'
  );
  const ssl = process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined;
  const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10);
  const idleTimeoutMillis = parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10);

  return {
    host,
    port,
    database,
    user,
    password,
    ssl,
    maxConnections,
    idleTimeoutMillis,
  };
}

let poolInstance: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

export function getPool(customConfig?: Partial<DbConfig>): pg.Pool {
  if (!poolInstance) {
    const config = { ...getDbConfig(), ...customConfig };
    poolInstance = new Pool({
      host: config.host,
      port: config.port,
      database: config.database,
      user: config.user,
      password: config.password,
      ssl: config.ssl,
      max: config.maxConnections,
      idleTimeoutMillis: config.idleTimeoutMillis,
    });

    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client pool', err);
    });
  }
  return poolInstance;
}

export function getDb(customConfig?: Partial<DbConfig>): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    const pool = getPool(customConfig);
    dbInstance = drizzle(pool, { schema });
  }
  return dbInstance;
}

export async function closeDb(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    dbInstance = null;
  }
}

export { schema };

