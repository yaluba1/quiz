import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('fs', () => {
  return {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    default: {
      existsSync: vi.fn(),
      readFileSync: vi.fn(),
    },
  };
});

import * as fs from 'fs';
import { readSecretOrEnv } from '../../../src/config/secrets.js';

describe('readSecretOrEnv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('reads secret from file when file exists', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('super_secret_file_value\n' as any);

    const result = readSecretOrEnv('/run/secrets/my_secret', 'ENV_FALLBACK', 'default');
    expect(result).toBe('super_secret_file_value');
  });

  it('falls back to environment variable if file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = readSecretOrEnv('/run/secrets/non_existent', 'MY_ENV_VALUE', 'default');
    expect(result).toBe('MY_ENV_VALUE');
  });

  it('falls back to default value if neither file nor envVar exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);

    const result = readSecretOrEnv(undefined, undefined, 'default_val');
    expect(result).toBe('default_val');
  });

  it('handles readFileSync error and falls back to envVar', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error('EACCES: permission denied');
    });

    const result = readSecretOrEnv('/run/secrets/error', 'FALLBACK', 'default');
    expect(result).toBe('FALLBACK');
  });
});

