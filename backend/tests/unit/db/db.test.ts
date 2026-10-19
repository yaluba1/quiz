import { describe, it, expect, vi, afterEach } from 'vitest';
import pg from 'pg';
import { getPool, getDb, closeDb } from '../../../src/db/index.js';

describe('Database Connection Pool Unit Tests', () => {
  beforeEach(async () => {
    await closeDb();
  });

  afterEach(async () => {
    await closeDb();
    vi.restoreAllMocks();
  });

  it('creates and returns singleton pg Pool instance', async () => {
    const endSpy = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(pg, 'Pool').mockImplementation((() => ({
      on: vi.fn(),
      end: endSpy,
    })) as any);

    const pool = getPool({ host: 'testhost' });
    expect(pool).toBeDefined();

    const db = getDb();
    expect(db).toBeDefined();

    await closeDb();
    expect(endSpy).toHaveBeenCalled();
  });
});
