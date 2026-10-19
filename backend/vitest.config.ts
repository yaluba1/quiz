import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
      exclude: [
        'dist/**',
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        'vitest.config.ts',
        'src/index.ts',
        'src/db/schema/**',
        'src/api/schemas/**',
        'src/**/types.ts',
      ],
    },
  },
});

