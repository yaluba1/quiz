import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getDb, closeDb } from './db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('[Migration] Starting database migrations...');
  const db = getDb();
  const migrationsFolder = path.resolve(__dirname, '../migrations');

  try {
    await migrate(db, { migrationsFolder });
    console.log('[Migration] All migrations executed successfully.');
  } catch (error) {
    console.error('[Migration] Failed to execute migrations:', error);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
}

runMigrations();

