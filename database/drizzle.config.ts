import { defineConfig } from 'drizzle-kit';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

function readSecretOrEnv(filePath?: string, envVar?: string, defaultValue = ''): string {
  if (filePath && fs.existsSync(filePath)) {
    try {
      return fs.readFileSync(filePath, 'utf8').trim();
    } catch {
      // Fallback to envVar
    }
  }
  return envVar || defaultValue;
}

const host = process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '5432', 10);
const database = process.env.DB_NAME || process.env.POSTGRES_DB || 'quiz_db';
const user = readSecretOrEnv(process.env.DB_USER_FILE || '/run/secrets/db_user', process.env.DB_USER, 'quiz_admin');
const password = readSecretOrEnv(process.env.DB_PASSWORD_FILE || '/run/secrets/db_password', process.env.DB_PASSWORD, 'quiz_secure_password_123');

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './migrations',
  dialect: 'postgresql',
  dbCredentials: {
    host,
    port,
    database,
    user,
    password,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  },
  verbose: true,
  strict: true,
});

