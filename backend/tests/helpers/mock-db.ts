import { vi } from 'vitest';
import * as dbModule from '../../src/db/index.js';

export function createMockDb(overrides: Record<string, any> = {}): any {
  const queryChain: any = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    ...overrides,
  };

  vi.spyOn(dbModule, 'getDb').mockReturnValue(queryChain as any);
  return queryChain;
}

