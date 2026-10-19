import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config/env.js';
import * as schema from './schema/index.js';

let poolInstance: pg.Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;

export function getPool(customConfig?: Partial<typeof config.db>): pg.Pool {
  if (!poolInstance) {
    const dbConf = { ...config.db, ...customConfig };
    poolInstance = new pg.Pool({
      host: dbConf.host,
      port: dbConf.port,
      database: dbConf.database,
      user: dbConf.user,
      password: dbConf.password,
      ssl: dbConf.ssl,
      max: dbConf.maxConnections,
      idleTimeoutMillis: dbConf.idleTimeoutMillis,
      client_encoding: 'UTF8',
    });

    poolInstance.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client pool', err);
    });
  }
  return poolInstance;
}

export function getDb(customConfig?: Partial<typeof config.db>): NodePgDatabase<typeof schema> {
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
export type Database = NodePgDatabase<typeof schema>;
